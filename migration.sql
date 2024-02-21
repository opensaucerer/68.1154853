--   contract_address: string; size 42
--   token_index: string;
--   listing_price: number;
--   maker: string;
--   listing_from: number;
--   listing_to: number;
--   event_timestamp: string;

CREATE TABLE IF NOT EXISTS activities (
  contract_address TEXT NOT NULL,
  token_index TEXT NOT NULL,
  listing_price NUMERIC NOT NULL,
  maker TEXT NOT NULL,
  listing_from TIMESTAMP,
  listing_to TIMESTAMP,
  event_timestamp TIMESTAMP NOT NULL
);

--  id
-- - index: string; size 42
-- - contract_address: string; size 42
-- - current_price: number
-- - last_listing_timestamp: number

CREATE TABLE IF NOT EXISTS nfts (
  token_index TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  current_price NUMERIC NOT NULL,
  last_listing_timestamp TIMESTAMP NOT NULL
);

-- unique index on nfts (index, contract_address);
CREATE UNIQUE INDEX nfts_index_contract_address ON nfts (token_index, contract_address);


-- constants
-- - id
-- name: string (unique)
-- value: string

CREATE TABLE IF NOT EXISTS constants (
    name TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
);