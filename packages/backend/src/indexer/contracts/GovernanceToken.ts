import { efficientLengthEncodingNaturalNumbers } from "../utils/efficientLengthEncoding";
import {
  makeEntityDefinition,
  makeIndexerDefinition,
  StorageHandleForIndexer,
} from "../process";
import { makeContractInstance } from "../../contracts";
import { GovernanceToken__factory } from "../../contracts/generated";
import { BigNumber, ethers } from "ethers";
import * as serde from "../serde";
import { RuntimeType } from "../serde";
import { encodeOrdinal, logToOrdinal, ordinal } from "./ordinal";

const governanceTokenContract = makeContractInstance({
  iface: GovernanceToken__factory.createInterface(),
  address: "0x4200000000000000000000000000000000000042",
  startingBlock: 6490467,
});

export const governanceTokenIndexer = makeIndexerDefinition(
  governanceTokenContract,
  {
    name: "GovernanceToken",

    entities: {
      TotalSupplySnapshot: makeEntityDefinition({
        serde: serde.object({
          ordinal,
          totalSupply: serde.bigNumber,
        }),
        indexes: [
          {
            indexName: "byOrdinal",
            indexKey({ ordinal }) {
              return encodeOrdinal(ordinal)
                .map((it) => efficientLengthEncodingNaturalNumbers(it.mul(-1)))
                .join("-");
            },
          },
        ],
      }),
      Aggregates: makeEntityDefinition({
        serde: serde.object({
          totalSupply: serde.bigNumber,
          delegatedSupply: serde.bigNumber,
        }),
        indexes: [],
      }),
      Address: makeEntityDefinition({
        serde: serde.object({
          address: serde.string,
          tokensOwned: serde.bigNumber,
          tokensRepresented: serde.bigNumber,
          delegatingTo: serde.string,
          accountsRepresentedCount: serde.bigNumber,
        }),
        indexes: [
          {
            indexName: "byTokensOwned",
            indexKey(entity) {
              return efficientLengthEncodingNaturalNumbers(
                entity.tokensOwned.mul(-1)
              );
            },
          },
          {
            indexName: "byTokensRepresented",
            indexKey(entity) {
              return efficientLengthEncodingNaturalNumbers(
                entity.tokensRepresented.mul(-1)
              );
            },
          },
          {
            indexName: "byTokenHoldersRepresented",
            indexKey(entity) {
              return efficientLengthEncodingNaturalNumbers(
                entity.accountsRepresentedCount.mul(-1)
              );
            },
          },
        ],
      }),
    },

    eventHandlers: [
      {
        signature: "Transfer(address,address,uint256)",
        async handle(handle, event, log) {
          const { from, to, value } = event.args;
          if (from === to) {
            return;
          }

          {
            const aggregate = await loadAggregate(handle);
            const previousTotalSupply = aggregate.totalSupply;
            if (to === ethers.constants.AddressZero) {
              aggregate.totalSupply = aggregate.totalSupply.sub(value);
            }

            if (from === ethers.constants.AddressZero) {
              aggregate.totalSupply = aggregate.totalSupply.add(value);
            }

            if (!previousTotalSupply.eq(aggregate.totalSupply)) {
              const ordinal = logToOrdinal(log);

              handle.saveEntity(
                "TotalSupplySnapshot",
                encodeOrdinal(ordinal).join("-"),
                {
                  ordinal,
                  totalSupply: aggregate.totalSupply,
                }
              );
            }

            saveAggregate(handle, aggregate);
          }

          const [fromEntity, toEntity] = await Promise.all([
            loadAccount(handle, from),
            loadAccount(handle, to),
          ]);

          fromEntity.tokensOwned = fromEntity.tokensOwned.sub(value);
          toEntity.tokensOwned = toEntity.tokensOwned.add(value);

          saveAccount(handle, fromEntity);
          saveAccount(handle, toEntity);
        },
      },
      {
        signature: "DelegateVotesChanged(address,uint256,uint256)",
        async handle(handle, event) {
          const account = await loadAccount(handle, event.args.delegate);

          if (!account.tokensRepresented.eq(event.args.previousBalance)) {
            throw new Error(
              `token balance incorrect. got ${account.tokensRepresented.toString()}, expected: ${event.args.previousBalance.toString()}`
            );
          }

          account.tokensRepresented = event.args.newBalance;

          const agg = await loadAggregate(handle);

          const change = event.args.newBalance.sub(event.args.previousBalance);
          agg.delegatedSupply = agg.delegatedSupply.add(change);

          saveAggregate(handle, agg);
          saveAccount(handle, account);
        },
      },
      {
        signature: "DelegateChanged(address,address,address)",
        async handle(handle, event) {
          if (event.args.fromDelegate === event.args.toDelegate) {
            return;
          }

          const delegatorAccount = await loadAccount(
            handle,
            event.args.delegator
          );

          if (delegatorAccount.delegatingTo !== event.args.fromDelegate) {
            throw new Error("mismatched from address");
          }

          delegatorAccount.delegatingTo = event.args.toDelegate;

          if (event.args.fromDelegate !== ethers.constants.AddressZero) {
            const fromAccount = await loadAccount(
              handle,
              event.args.fromDelegate
            );

            fromAccount.accountsRepresentedCount =
              fromAccount.accountsRepresentedCount.sub(1);
            saveAccount(handle, fromAccount);
          }

          if (event.args.toDelegate !== ethers.constants.AddressZero) {
            const toAccount = await loadAccount(handle, event.args.toDelegate);

            toAccount.accountsRepresentedCount =
              toAccount.accountsRepresentedCount.add(1);

            saveAccount(handle, toAccount);
          }

          saveAccount(handle, delegatorAccount);
        },
      },
    ],
  }
);

export function defaultAccount(
  from: string
): RuntimeType<typeof governanceTokenIndexer["entities"]["Address"]["serde"]> {
  return {
    address: from,
    tokensOwned: ethers.BigNumber.from(0),
    tokensRepresented: ethers.BigNumber.from(0),
    accountsRepresentedCount: BigNumber.from(1),
    delegatingTo: ethers.constants.AddressZero,
  };
}

async function loadAccount(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof governanceTokenIndexer>,
  from: string
): Promise<
  RuntimeType<typeof governanceTokenIndexer["entities"]["Address"]["serde"]>
> {
  return (await handle.loadEntity("Address", from)) ?? defaultAccount(from);
}

function saveAccount(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof governanceTokenIndexer>,
  entity: RuntimeType<
    typeof governanceTokenIndexer["entities"]["Address"]["serde"]
  >
) {
  return handle.saveEntity("Address", entity.address, entity);
}

export const aggregateCumulativeId = "CUMULATIVE";

export function makeDefaultAggregate() {
  return {
    delegatedSupply: ethers.BigNumber.from(0),
    totalSupply: ethers.BigNumber.from(0),
  };
}

async function loadAggregate(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof governanceTokenIndexer>
) {
  const cumulativeAggregate = await handle.loadEntity(
    "Aggregates",
    aggregateCumulativeId
  );

  return cumulativeAggregate ?? makeDefaultAggregate();
}

function saveAggregate(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof governanceTokenIndexer>,
  entity: RuntimeType<
    typeof governanceTokenIndexer["entities"]["Aggregates"]["serde"]
  >
) {
  return handle.saveEntity("Aggregates", aggregateCumulativeId, entity);
}
