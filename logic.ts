import * as reservoir from './reservoir';
import * as repository from './repository';
import event from './event';
import env from './env';
import logger from './logger';
import { RowDataPacket } from 'mysql2';

export async function captureEvents() {
  logger.info('[captureEvents] Starting to capture events');

  let continuationToken = '';

  // find the last processed event id
  const [rows] = (await repository.selectOne('constants', {
    name: 'last_processed_continuation_token',
  })) as RowDataPacket[];

  if (rows && rows.length) {
    continuationToken = rows[0].value;
  }

  for await (const [activities, token] of reservoir.fetchListingActivities(
    1000, // adjust the limit as needed
    continuationToken
  )) {
    // save the activities to the database
    await repository.insertMany(activities, 'activities', {
      yes: true,
      do: 'event_timestamp = VALUES(event_timestamp)',
    });

    // emit an event
    event.emit(env.POST_CAPTURE_EVENT, activities);

    if (token) {
      // update the last processed event continuation token
      await repository.insert(
        {
          name: 'last_processed_continuation_token',
          value: token,
        },
        'constants',
        {
          yes: true,
          on: 'name',
          do: 'value = VALUES(value)',
        }
      );
    }
  }

  logger.info('[captureEvents] Finished capturing events');
}

export interface INft {
  token_index: string;
  contract_address: string;
  current_price: number | null;
  last_listing_timestamp: string;
}

export async function postCaptureProcessing() {
  event.on(env.POST_CAPTURE_EVENT, async (payload: reservoir.IActivity[]) => {
    logger.info(
      '[postCaptureProcessing] Processing ' + payload.length + ' activities'
    );

    const nfts: Record<string, INft> = {};

    payload.forEach((activity) => {
      if (!nfts[activity.contract_address + activity.token_index]) {
        nfts[activity.contract_address + activity.token_index] = {
          token_index: activity.token_index,
          contract_address: activity.contract_address,
          current_price: activity.listing_price,
          last_listing_timestamp: activity.event_timestamp,
        };
      }

      // if the listing has expired and it is more recent than the current price, set the current price to null
      if (
        activity.listing_to &&
        activity.listing_to < Date.now() / 1000 &&
        activity.event_timestamp >
          nfts[activity.contract_address + activity.token_index]
            .last_listing_timestamp
      ) {
        nfts[activity.contract_address + activity.token_index].current_price =
          null;
      }

      if (activity.listing_to && activity.listing_to >= Date.now() / 1000) {
        // if the listing is not expired, set the current price to the lowest price
        if (
          activity.listing_price <
          (nfts[activity.contract_address + activity.token_index]
            .current_price ?? 0)
        ) {
          nfts[activity.contract_address + activity.token_index].current_price =
            activity.listing_price;
        }
      }
    });

    // use on conflict based insertion to avoid the need for an extra existence check query
    await repository.insertMany(Object.values(nfts), 'nfts', {
      yes: true,
      on: 'contract_address, token_index',
      do: 'current_price = VALUES(current_price), last_listing_timestamp = VALUES(last_listing_timestamp)',
    });

    logger.info(
      '[postCaptureProcessing] Finished processing ' +
        payload.length +
        ' activities'
    );
  });
}
