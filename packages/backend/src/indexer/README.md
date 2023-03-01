# indexer

A special kind of database for aggregating events from blockchains.

Goals:

- Ingest as fast as hardware physically allows. Don't strangle performance with
  abstractions. Iterating on the storage format should take minutes not hours.

- Handle forks correctly. Execute a query at any point in history and get
  correct results.

- Augment on-chain data with off-chain data.
