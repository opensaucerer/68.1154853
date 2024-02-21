import * as reservoir from './reservoir';
import * as repository from './repository';
import event from './event';
import env from './env';
import logger from './logger';

export async function captureEvents() {
  logger.debug('[captureEvents] Starting to capture events');

  // find the last processed event id
  const row = await repository.selectOne('events');

  for await (const activities of reservoir.fetchListingActivities()) {
    console.log('Activities', activities);

    // save the activities to the database
    await repository.insertMany(activities, 'activities');

    // emit an event
    event.emit(env.POST_CAPTURE_EVENT, activities);
  }

  logger.debug('[captureEvents] Finished capturing events');
}

export interface INft {
  index: number;
  contract_address: string;
  current_price: number;
  last_listing_timestamp: number;
}

export async function postCaptureProcessing() {
  event.on(env.POST_CAPTURE_EVENT, async (payload: reservoir.IActivity[]) => {
    logger.debug(
      '[postCaptureProcessing] Processing ' + payload.length + ' activities'
    );

    // do some processing
    console.log('Processing activities', payload);

    const nfts: Partial<INft> = {};

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
          index: activity.token_index,
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
      on: 'contract_address, index',
      do: 'UPDATE SET current_price = EXCLUDED.current_price, last_listing_timestamp = EXCLUDED.last_listing_timestamp',
    });

    logger.debug(
      '[postCaptureProcessing] Finished processing ' +
        payload.length +
        ' activities'
    );
  });
}
