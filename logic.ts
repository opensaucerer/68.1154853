import * as reservoir from './reservoir';
import * as repository from './repository';
import event from './event';
import env from './env';
import logger from './logger';
import { RowDataPacket } from 'mysql2';

export async function captureEvents() {
  logger.info('[captureEvents] Starting to capture events');

  let eventId = '';

  // find the last processed event id
  const [rows] = (await repository.selectOne('events', {
    name: 'last_processed_event_id',
  })) as RowDataPacket[];

  if (rows && rows.length) {
    eventId = rows[0].value;
  }

  for await (const activities of reservoir.fetchListingActivities(
    1000,
    eventId
  )) {
    console.log('Activities', activities);

    // save the activities to the database
    await repository.insertMany(activities, 'activities');

    // emit an event
    event.emit(env.POST_CAPTURE_EVENT, activities);

    // update the last processed event id
    await repository.insert(
      { last_processed_event_id: activities[activities.length - 1].event_id },
      'events',
      {
        yes: true,
        on: 'name',
        do: 'UPDATE SET value = EXCLUDED.value',
      }
    );
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

    // do some processing
    console.log('Processing activities', payload);

    const nfts: Record<string, INft> = {};

    payload.forEach((activity) => {
      if (!nfts[activity.contract_address + activity.token_index]) {
        // if the listing has expired and it is more recent than the current price, set the current price to null
        const current_price =
          activity.listing_to &&
          activity.listing_to < Date.now() / 1000 &&
          new Date(activity.event_timestamp) >
            new Date(
              nfts[
                activity.contract_address + activity.token_index
              ].last_listing_timestamp
            )
            ? null
            : activity.listing_price;

        nfts[activity.contract_address + activity.token_index] = {
          token_index: activity.token_index,
          contract_address: activity.contract_address,
          current_price,
          last_listing_timestamp: activity.event_timestamp,
        };
      } else {
        // if the listing is not expired, set the current price to the lowest price
        if (activity.listing_to && activity.listing_to >= Date.now() / 1000) {
          if (
            activity.listing_price <
            (nfts[activity.contract_address + activity.token_index]
              .current_price ?? 0)
          ) {
            nfts[
              activity.contract_address + activity.token_index
            ].current_price = activity.listing_price;
          }
        }
      }
    });

    // use on conflict based insertion to avoid the need for an extra existence check query
    await repository.insertMany(Object.values(nfts), 'nfts', {
      yes: true,
      on: 'contract_address, token_index',
      do: 'UPDATE SET current_price = EXCLUDED.current_price, last_listing_timestamp = EXCLUDED.last_listing_timestamp',
    });

    logger.info(
      '[postCaptureProcessing] Finished processing ' +
        payload.length +
        ' activities'
    );
  });
}
