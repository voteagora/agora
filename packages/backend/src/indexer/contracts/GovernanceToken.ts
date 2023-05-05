import { makeIndexerDefinition } from "../process";
import { makeContractInstance } from "../../contracts";
import { BigNumber, ethers } from "ethers";
import { RuntimeType } from "../serde";
import { ENSToken__factory } from "../../contracts/generated/factories/ENSToken__factory";
import { entityDefinitions, Handle, saveAccount } from "./entityDefinitions";

const governanceTokenContract = makeContractInstance({
  iface: ENSToken__factory.createInterface(),
  address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
  startingBlock: 13533418,
});

export const governanceTokenIndexer = makeIndexerDefinition(
  governanceTokenContract,
  entityDefinitions,
  {
    name: "ENS",

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
): RuntimeType<typeof entityDefinitions["Address"]["serde"]> {
  return {
    address: from,
    tokensOwned: ethers.BigNumber.from(0),
    tokensRepresented: ethers.BigNumber.from(0),
    accountsRepresentedCount: BigNumber.from(1),
    delegatingTo: ethers.constants.AddressZero,
    votesCasted: BigNumber.from(0),
  };
}

async function loadAccount(
  // @ts-ignore
  handle: Handle,
  from: string
): Promise<RuntimeType<typeof entityDefinitions["Address"]["serde"]>> {
  return (await handle.loadEntity("Address", from)) ?? defaultAccount(from);
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
  handle: Handle
) {
  const cumulativeAggregate = await handle.loadEntity(
    "Aggregates",
    aggregateCumulativeId
  );

  return cumulativeAggregate ?? makeDefaultAggregate();
}

function saveAggregate(
  // @ts-ignore
  handle: Handle,
  entity: RuntimeType<typeof entityDefinitions["Aggregates"]["serde"]>
) {
  return handle.saveEntity("Aggregates", aggregateCumulativeId, entity);
}
