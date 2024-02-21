CREATE TABLE IF NOT EXISTS activities (
  contract_address VARCHAR(42) NOT NULL,
  token_index VARCHAR(255) NOT NULL,
  listing_price DECIMAL(10, 2) NOT NULL,
  maker VARCHAR(42) NOT NULL,
  listing_from BIGINT,
  listing_to BIGINT,
  event_timestamp TIMESTAMP NOT NULL,
  event_id VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS nfts (
  token_index VARCHAR(255) NOT NULL,
  contract_address VARCHAR(42) NOT NULL,
  current_price DECIMAL(18, 2),
  last_listing_timestamp TIMESTAMP NOT NULL,
  UNIQUE(token_index, contract_address)
);

CREATE TABLE IF NOT EXISTS constants (
    name VARCHAR(255) NOT NULL UNIQUE,
    value VARCHAR(255) NOT NULL
);