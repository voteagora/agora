import { BigNumber, ethers } from "ethers";

import { makeContractInstance } from "../../contracts";
import { NounsToken__factory } from "../../contracts/generated";
import { subtractItems, unionItems } from "../../utils/set";
import { makeIndexerDefinition } from "../process";
import { RuntimeType } from "../serde";

import {
  entityDefinitions,
  Handle,
  saveAddressSnapshot,
} from "./entityDefinitions";

const nounsTokenContract = makeContractInstance({
  iface: NounsToken__factory.createInterface(),
  address: "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03",
  startingBlock: 12985438,
});

export const nounsTokenIndexer = makeIndexerDefinition(
  nounsTokenContract,
  entityDefinitions,
  {
    name: "NounsToken",

    eventHandlers: [
      {
        signature: "NounCreated(uint256,(uint48,uint48,uint48,uint48,uint48))",
        async handle(handle, event) {
          const { tokenId, seed } = event.args;

          handle.saveEntity("Noun", tokenId.toString(), {
            tokenId: tokenId,
            background: seed.background,
            body: seed.body,
            accessory: seed.accessory,
            glasses: seed.glasses,
            head: seed.head,
          });
        },
      },
      {
        signature: "Transfer(address,address,uint256)",
        async handle(handle, event, log) {
          const { from, to, tokenId } = event.args;
          if (from === to) {
            return;
          }

          await Promise.all([
            (async () => {
              const aggregate = await loadAggregate(handle);
              if (to === ethers.constants.AddressZero) {
                aggregate.totalSupply = aggregate.totalSupply.sub(1);
              }

              if (from === ethers.constants.AddressZero) {
                aggregate.totalSupply = aggregate.totalSupply.add(1);
              }

              saveAggregate(handle, aggregate);
            })(),
            (async () => {
              const fromEntity = await loadAccount(handle, from);

              fromEntity.tokensOwned = fromEntity.tokensOwned.sub(1);
              fromEntity.tokensOwnedIds = fromEntity.tokensOwnedIds.filter(
                (it) => !it.eq(tokenId)
              );

              saveAccount(handle, fromEntity);

              const fromEntityDelegate = await loadAccount(
                handle,
                fromEntity.delegatingTo
              );

              fromEntityDelegate.tokensRepresentedIds = unionItems(
                fromEntityDelegate.tokensRepresentedIds,
                fromEntity.tokensOwnedIds
              );

              saveAccount(handle, fromEntityDelegate);
              saveAddressSnapshot(handle, fromEntityDelegate, log);
            })(),

            (async () => {
              const toEntity = await loadAccount(handle, to);

              toEntity.tokensOwned = toEntity.tokensOwned.add(1);
              toEntity.tokensOwnedIds = [...toEntity.tokensOwnedIds, tokenId];

              saveAccount(handle, toEntity);

              const toEntityDelegate = await loadAccount(
                handle,
                toEntity.delegatingTo
              );

              toEntityDelegate.tokensRepresentedIds = subtractItems(
                toEntityDelegate.tokensRepresentedIds,
                toEntity.tokensOwnedIds
              );

              saveAccount(handle, toEntityDelegate);
              saveAddressSnapshot(handle, toEntityDelegate, log);
            })(),
          ]);
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
        async handle(handle, event, log) {
          if (event.args.fromDelegate === event.args.toDelegate) {
            return;
          }

          const delegatorAccount = await loadAccount(
            handle,
            event.args.delegator
          );

          if (
            delegatorAccount.delegatingTo !== ethers.constants.AddressZero &&
            delegatorAccount.delegatingTo !== event.args.fromDelegate
          ) {
            throw new Error("mismatched from address");
          }

          delegatorAccount.delegatingTo = event.args.toDelegate;

          saveAccount(handle, delegatorAccount);

          await Promise.all([
            (async () => {
              if (event.args.fromDelegate !== ethers.constants.AddressZero) {
                const fromAccount = await loadAccount(
                  handle,
                  event.args.fromDelegate
                );

                fromAccount.accountsRepresentedCount =
                  fromAccount.accountsRepresentedCount.sub(1);
                fromAccount.tokensRepresentedIds = subtractItems(
                  fromAccount.tokensRepresentedIds,
                  delegatorAccount.tokensOwnedIds
                );

                saveAccount(handle, fromAccount);
                saveAddressSnapshot(handle, fromAccount, log);
              }
            })(),
            (async () => {
              if (event.args.toDelegate !== ethers.constants.AddressZero) {
                const toAccount = await loadAccount(
                  handle,
                  event.args.toDelegate
                );

                toAccount.accountsRepresentedCount =
                  toAccount.accountsRepresentedCount.add(1);
                toAccount.tokensRepresentedIds = unionItems(
                  toAccount.tokensRepresentedIds,
                  delegatorAccount.tokensOwnedIds
                );

                saveAccount(handle, toAccount);
                saveAddressSnapshot(handle, toAccount, log);
              }
            })(),
          ]);
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
    tokensRepresentedIds: [],
    tokensOwnedIds: [],
    accountsRepresentedCount: BigNumber.from(1),
    delegatingTo: from,
    votesCast: BigNumber.from(0),
  };
}

export async function loadAccount(
  handle: Handle,
  from: string
): Promise<RuntimeType<typeof entityDefinitions["Address"]["serde"]>> {
  return (await handle.loadEntity("Address", from)) ?? defaultAccount(from);
}

export function saveAccount(
  handle: Handle,
  entity: RuntimeType<typeof entityDefinitions["Address"]["serde"]>
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

export async function loadAggregate(handle: Handle) {
  const cumulativeAggregate = await handle.loadEntity(
    "Aggregates",
    aggregateCumulativeId
  );

  return cumulativeAggregate ?? makeDefaultAggregate();
}

export function saveAggregate(
  handle: Handle,
  entity: RuntimeType<typeof entityDefinitions["Aggregates"]["serde"]>
) {
  return handle.saveEntity("Aggregates", aggregateCumulativeId, entity);
}
