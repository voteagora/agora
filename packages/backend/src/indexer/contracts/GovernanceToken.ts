import { efficientLengthEncodingNaturalPositiveNumbers } from "../utils/efficientLengthEncoding";
import {
  makeEntityDefinition,
  makeIndexerDefinition,
  StorageHandleForIndexer,
} from "../process";
import { makeContractInstance } from "../../contracts";
import { GovernanceToken__factory } from "../../contracts/generated";
import { ethers } from "ethers";
import * as serde from "../serde";
import { RuntimeType } from "../serde";

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
      Aggregates: makeEntityDefinition({
        serde: serde.object({
          totalSupply: serde.bigNumber,
          delegatedSupply: serde.bigNumber,
        }),
      }),
      Address: makeEntityDefinition({
        serde: serde.object({
          address: serde.string,
          tokensOwned: serde.bigNumber,
          tokensRepresented: serde.bigNumber,
          delegatingTo: serde.string,
          accountsRepresented: serde.passthrough<string[]>(),
        }),
        indexes: [
          {
            indexName: "byTokenOwned",
            indexKey(entity) {
              return efficientLengthEncodingNaturalPositiveNumbers(
                entity.tokensOwned
              );
            },
          },
          {
            indexName: "byTokensRepresented",
            indexKey(entity) {
              return efficientLengthEncodingNaturalPositiveNumbers(
                entity.tokensRepresented
              );
            },
          },
          {
            indexName: "byTokenHoldersRepresented",
            indexKey(entity) {
              return efficientLengthEncodingNaturalPositiveNumbers(
                ethers.BigNumber.from(entity.accountsRepresented.length)
              );
            },
          },
        ],
      }),
    },

    eventHandlers: [
      {
        signature: "Transfer(address,address,uint256)",
        async handle(handle, event) {
          const { from, to, value } = event.args;
          if (from === to) {
            return;
          }

          const aggregate = await loadAggregate(handle);
          if (to === ethers.constants.AddressZero) {
            aggregate.totalSupply = aggregate.totalSupply.sub(value);
          }

          if (from === ethers.constants.AddressZero) {
            aggregate.totalSupply = aggregate.totalSupply.add(value);
          }

          const [fromEntity, toEntity] = await Promise.all([
            loadAccount(handle, from),
            loadAccount(handle, to),
          ]);

          fromEntity.tokensOwned = fromEntity.tokensOwned.sub(value);
          toEntity.tokensOwned = toEntity.tokensOwned.add(value);

          saveAccount(handle, fromEntity);
          saveAccount(handle, toEntity);
          saveAggregate(handle, aggregate);
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
            const delegatorIndex = fromAccount.accountsRepresented.indexOf(
              event.args.delegator
            );
            if (delegatorIndex === -1) {
              throw new Error("delegator not found in from account");
            }

            fromAccount.accountsRepresented.splice(delegatorIndex, 1);
            saveAccount(handle, fromAccount);
          }

          if (event.args.toDelegate !== ethers.constants.AddressZero) {
            const toAccount = await loadAccount(handle, event.args.toDelegate);

            toAccount.accountsRepresented = [
              ...toAccount.accountsRepresented,
              event.args.delegator,
            ];

            saveAccount(handle, toAccount);
          }

          saveAccount(handle, delegatorAccount);
        },
      },
    ],
  }
);

async function loadAccount(
  // @ts-expect-error
  handle: StorageHandleForIndexer<typeof governanceTokenIndexer>,
  from: string
) {
  return (
    (await handle.loadEntity("Address", from)) ?? {
      address: from,
      tokensOwned: ethers.BigNumber.from(0),
      tokensRepresented: ethers.BigNumber.from(0),
      accountsRepresented: [from],
      delegatingTo: ethers.constants.AddressZero,
    }
  );
}

function saveAccount(
  // @ts-expect-error
  handle: StorageHandleForIndexer<typeof governanceTokenIndexer>,
  entity: RuntimeType<
    typeof governanceTokenIndexer["entities"]["Address"]["serde"]
  >
) {
  return handle.saveEntity("Address", entity.address, entity);
}

const aggregateCumulativeId = "CUMULATIVE";

async function loadAggregate(
  // @ts-expect-error
  handle: StorageHandleForIndexer<typeof governanceTokenIndexer>
) {
  const cumulativeAggregate = await handle.loadEntity(
    "Aggregates",
    aggregateCumulativeId
  );

  return {
    delegatedSupply:
      cumulativeAggregate?.delegatedSupply ?? ethers.BigNumber.from(0),
    totalSupply: cumulativeAggregate?.totalSupply ?? ethers.BigNumber.from(0),
  };
}

function saveAggregate(
  // @ts-expect-error
  handle: StorageHandleForIndexer<typeof governanceTokenIndexer>,
  entity: RuntimeType<
    typeof governanceTokenIndexer["entities"]["Aggregates"]["serde"]
  >
) {
  return handle.saveEntity("Aggregates", aggregateCumulativeId, entity);
}
