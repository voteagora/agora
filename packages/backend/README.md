# backend

## Fetching Past Events

There are two kinds of indexing.

|                       | Real-time Indexing                                                     | Backfill Indexing                                                 |
| --------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Indexing Performance  | ~10x faster than realtime                                              | \> ~100x faster than real time (depending on workload)            |
| Node Access Pattern   | Block by block                                                         | Large batch reads                                                 |
| Node Access Cost      | High (fetch each block and its logs)                                   | Low (fetch logs from thousands to millions of blocks at a time)   |
| Tip of Chain Behavior | Handles Reorgs                                                         | Unable to handle reorgs, indexes a safe distance behind chain tip |
| Used for              | Keeping up to date with the tip of chain in development and production | Rebuilding the index from scratch, schema updates                 |

It is necessary to perform a backfill when running the backend for the first
time and recommended when fast forwarding to the chain tip from far behind.

First, fetch logs from dependent contracts.

```
$ yarn indexer fetch
```

Fetch will incrementally fetch all new logs emitted since the last fetch.

> ⚠️ NOTE: If add a new event handler tracking a log which was previously not
> fetched is added, fetch will not go back and insert logs for the new event
> handler. Delete the `data/{deployment-name}/logs` folder and run fetch again
> to correctly fetch the new logs. See [AGORA-725] for status on fixing this.

Next, run backfill

```
$ yarn indexer backfill
```

This will go through the fetched logs, block-by-block executing event handlers
and construct state for serving your application storing the result in leveldb.
If backfill was run previously, it will continue from the point where the last
backfill ended, only processing logs not seen before.

> ⚠️ NOTE: backfill does not automatically react to schema changes. If you add
> event handlers or change the storage layout created by event handlers or
> entity definitions, backfill and reading from storage will have incorrect
> results. Delete the `data/{deployment-name}/state` folder and re-run backfill
> to correctly handle breaking changes in the storage layout. See [AGORA-726]
> for status on fixing this.

## Local Development

```
$ yarn start
```

## Deploying to Cloudflare Workers

There are a few steps:

1. Deploy code
2. Load initial state into durable object
3. Start realtime indexing

### Deploy code

Deploy the application to a worker, this can be done from the wrangler CLI or
github actions.

Only instructions for GitHub Actions will be outlined here. The Wrangler CLI
method is available, has a bunch of details to get right. Read through the
wrangler.toml and Cloudflare Docs to understand how to use the wrangler cli to
deploy.

For GitHub Actions,
visit https://github.com/0xcaff/nouns-agora/actions/workflows/deploy.yml click
run workflow and choose a branch.

### Load initial state

Realtime indexing can track the tip of the chain handling reorgs but is not fast
enough to catch up to the head of chain in a timely manner. To help it along, we
generate and upload an initial state.

```
$ yarn indexer fetch
$ yarn indexer backfill
$ yarn indexer dump
```

This will create a file in packages/backend/data/deployments/nouns/dump.jsonl
with a representation of all entities and indexes.

To push this up to the backend:

```
$ AGORA_ADMIN_API_KEY= AGORA_INSTANCE_ENV=dev AGORA_INSTANCE_NAME=stable yarn ops load
```

- `AGORA_ADMIN_API_KEY` specifies a secret key which is checked before allowing
  access to admin endpoints. In dev this value is empty.

- `AGORA_INSTANCE_ENV` Which instance of the nouns application we're targeting.
  Valid values are `prod` or `dev`.

- `AGORA_INSTANCE_NAME` specifies an identifier for the instance of our
  application to target. We usually want to target an instance which isn't
  serving traffic.

### Start realtime indexing

Next we start realtime indexing by running.

```
$ AGORA_ADMIN_API_KEY= AGORA_INSTANCE_ENV=dev AGORA_INSTANCE_NAME=stable yarn ops start
```

Next, we change the `PRIMARY_DURABLE_OBJECT_INSTANCE_NAME` in wrangler.toml to
whatever we used for `AGORA_INSTANCE_NAME` and deploy to switch read traffic to
the new instance.
