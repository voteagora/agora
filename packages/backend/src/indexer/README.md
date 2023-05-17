# indexer

A special kind of database for aggregating events from blockchains.

Goals:

- Ingest as fast as hardware physically allows. Don't strangle performance with
  abstractions. Iterating on the storage format should take minutes not hours.

- Handle forks correctly. Execute a query at any point in history and get
  correct results.

- Augment on-chain data with off-chain data.

## State Migration

- Export env variable: `ALCHEMY_API_KEY=alchemy_api_key`
- `yarn fetch` - fetches OptimismGovernorTest & GovernanceToken
- `yarn backfill` -- indexes the contract events and creates local instnace of DurableObjects storage
- `yarn dump` -- creates a dump json file
- `export ADMIN_API_KEY=` -- this is empty string for dev
- `export DURABLE_OBJECT_INSTANCE_NAME=new_name` -- create a new instance name to dump the state
- make sure `..ops/adminMessage.ts` url is pointing to the correct env
  - https://optimism-agora-dev.agora-dev.workers.dev/admin/ops for dev
- `yarn stream` -- this loads up the dump file to the new DurableObject instance
- update `../../wrangler.toml` to point the new DurableObject instance & deploy through github actions

- After deployment, need to send admin message to start indexer: `yarn send-admin-message START`

## State Migration Prod

> ⚠️ IMPORTANT: Clear `../data/logs` & `../data/state` & `../data/dump`

- Export env variable: `ALCHEMY_API_KEY=alchemy_api_key`
- `yarn fetch-prod` - fetches OptimismGovernor & GovernanceToken
- `yarn backfill` -- indexes the contract events and creates local instnace of DurableObjects storage
- `yarn dump` -- creates a dump json file
- `export ADMIN_API_KEY=`
- `export DURABLE_OBJECT_INSTANCE_NAME=new_name` -- create a new instance name to dump the state
- update `..ops/adminMessage.ts` url to point to https://optimism-agora-prod.agora-prod.workers.dev/admin/ops
- `yarn stream` -- this loads up the dump file to the new DurableObject instance
- update `../../wrangler.toml` to point the new DurableObject instance & deploy through github actions

- After deployment, need to send admin message to start indexer: `yarn send-admin-message START`
