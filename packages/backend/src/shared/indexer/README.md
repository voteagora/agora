# indexer

A specialized data store for serving views on top of blockchain event streams.

# Motivation

One complex part of building dApps is getting data derived from actions
happening on chain into your app. The easier it is to bring in interesting data
from on-chain and summarize it into something useful for users, the more build
powerful, useful apps will be built.

## 🤸‍ Flexibility

Fundamentally, which queries can be served quickly is defined by the storage
format of your data. Do you store related things together or apart? Which work
is done at write time and what work is done at read time? Answering these
questions requires making tradeoffs. Your application defines your queries and
your queries define your storage format. Generalized solutions can only do so
much to answer the question.

This library provides the building blocks, imposing as few constraints as
possible on how data is stored and how it is read. You make the tradeoffs which
make sense for your application. Do as little or as much work at write time as
you want. Use whatever serving layer you want: GraphQL, REST, tRPC or bring
your own.

## 🏎 Indexing Performance

When building apps, there's a lot of unknowns. Which data does my application
need? How do I compute and serve it efficiently? Finding the answers to these
unknowns takes iteration. Iteration should take minutes not hours or days.

We're able to index most contracts, including the ones with the most
transactions in minutes. We do as much work incrementally as possible so
operations like rebuilding an index from already fetched logs and ingesting new
logs into an index are fast.

## 🔒 Control

Data is core to any application. The set of things which you need to think
about when your application is in production should be minimal. You should
control where data is stored and where it is served from. Costs should be
predictable.

You can deploy where you see fit. Cloudflare Workers is supported out of the
box. Store data in whatever storage engine you chose (just satisfy a KV
interface with a few consistency requirements).

Pay your cloud provider, not a value-add service provider. Point to any EVM
compatible chain (even simulated ones).

# What are indexers and why are they necessary?

Storage operations on values in ethereum state executed are expensive. Storing
a (u)int256 (32 bytes) costs between 3k and 20k gas. Reading a (u)int256 costs
2.1k gas<sup>[1][sstore-cost]</sup>. At a gas price of @ 30 gwei and an ETH
price of $2k, 1k gas is $0.06.

Data stored in state is accessible through JSON-RPC APIs like [eth_call]
and [eth_getStorageAt].

Data in state isn't enough to build many apps. In order to keep costs manageable
for people interacting with contracts, contracts store a minimal set of data in
ethereum state. A few examples of this:

- Governance contracts often store voting status for a proposal and voter but
  not their reason, vote timestamp or weight. These values are checked and
  discarded, added to an aggregate or in the case of reason emitted as logs.

- ERC-20 tokens store a balance for each account but not information
  about where funds came from. When a transfer is attempted, the sender is
  validated and after a sufficient balance check, their balance is reduced and
  the receiver's balance is increased.

Apps like etherscan are able to show transaction history by observing actions
happening on chain including log emissions, transactions and state changes and
updating a physical representation optimized for serving the application API.

Indexers solve this problem of listening to the chain and storing the updates in
a format optimized for serving a specific application workload. They're
necessary because the storage format for operations on-chain and the storage
format to power useful applications are often different.

# Priors

- **TheGraph including hosted subgraphs and goldsky**

  Even with the simplest query you could possibly execute of fetching one
  field by id from chain tip takes over 100ms. Once you start pulling down
  related entities, performance continues to degrade. The performance
  shortcomings seem to stem from a complex storage architecture not optimized
  for serving. This applies to the hosted graph, goldsky and most indexers.

  Indexing performance is quite slow too with low traffic contracts (< 20k
  events) taking hours to index instead of seconds.

  Cost is high and unpredictable. Finding people to index your subgraph is yet
  another thing to think about.

  While the decentralized network provides trust guarantees, there are cheaper
  ways for users to get these same trust guarantees (run indexer locally).

[sstore-cost]: https://hackmd.io/@fvictorio/gas-costs-after-berlin
[eth_call]: https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_call
[eth_getstorageat]: https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getstorageat
