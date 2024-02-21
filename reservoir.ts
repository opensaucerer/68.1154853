// this is assumed to be a service file (external service) that'll fetch data from the reservoir.tools api
import axios from 'axios';
import constant from './env';

export interface IActivity {
  contract_address: string;
  token_index: string;
  listing_price: number;
  maker: string;
  listing_from: number;
  listing_to: number;
  event_timestamp: string;
}

export interface IEvents {
  events: IOrderEvent[];
  continuation: string;
}

export interface IOrderEvent {
  order: IOrder;
  event: IEvent;
}

export interface IOrder {
  id: string;
  status: string;
  contract: string;
  maker: string;
  price: {
    currency: {
      contract: string;
      name: string;
      symbol: string;
      decimals: number;
    };
    amount: {
      raw: string;
      decimal: number;
      usd: number;
      native: number;
    };
  };
  quantityRemaining: number;
  nonce: string;
  validFrom: number;
  validUntil: number;
  rawData: {
    kind: string;
    salt: string;
    zone: string;
    offer: {
      token: string;
      itemType: number;
      endAmount: string;
      startAmount: string;
      identifierOrCriteria: string;
    }[];
    counter: string;
    endTime: number;
    offerer: string;
    partial: boolean;
    zoneHash: string;
    orderType: number;
    startTime: number;
    conduitKey: string;
    consideration: {
      token: string;
      itemType: number;
      endAmount: string;
      recipient: string;
      startAmount: string;
      identifierOrCriteria: string;
    }[];
  };
  kind: string;
  source: string;
  isDynamic: boolean;
  criteria: {
    kind: string;
    data: {
      token: {
        tokenId: string;
      };
    };
  };
}

export interface IEvent {
  id: string;
  kind: string;
  txHash: string;
  txTimestamp: string;
  createdAt: string;
}

/**
 * Fetches all recent listing events from the /events/asks/v3 endpoint
 * If no event id is provided, it fetches all events
 *
 * https://api.reservoir.tools/events/asks/v3?limit=1000&sortDirection=asc
 */
export async function* fetchListingActivities(
  limit = 1000,
  eventId?: string
): AsyncGenerator<IActivity[]> {
  // fetch from the api
  let done = false;
  let continuationToken = '';

  while (!done) {
    let url = `${constant.RESERVOIR_API_URL}/events/asks/v3?limit=${limit}`;
    if (continuationToken) {
      url += `&continuation=${continuationToken}`;
    }
    const response = await axios.get(url);

    const events: IEvents = response.data;

    // if there are no more events, we are done
    if (!events.events.length) {
      done = true;
    }
    if (!events.continuation) {
      done = true;
    }
    // if we have an event id, we need to check if we have reached it
    if (eventId && events.events.some((event) => event.event.id === eventId)) {
      done = true;
    }
    if (events.continuation) {
      continuationToken = events.continuation;
    }
    const activities: IActivity[] = [];
    events.events.forEach((event) => {
      if (event.event.kind === 'new-order') {
        activities.push({
          contract_address: event.order.contract,
          token_index: event.order.criteria.data.token.tokenId,
          listing_price: event.order.price.amount.native,
          maker: event.order.maker,
          listing_from: event.order.validFrom,
          listing_to: event.order.validUntil,
          event_timestamp: event.event.createdAt,
        });
      }
    });
    yield activities;
  }
}
