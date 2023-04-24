import { ethers } from "ethers";

import { makeIndexerDefinition } from "../../../indexer";
import {
  AbiEventsMapping,
  ContractInstance,
} from "../../../indexer/process/contractInstance";
import { subtractItems, unionItems } from "../../../utils/set";
import { loadAggregate, saveAggregate } from "../IVotes/entities/aggregate";
import { updateTotalSupply } from "../IVotes/updateTotalSupply";

import { erc721EntityDefinitions } from "./entities";
import { loadAccount, saveAccount } from "./entities/address";
import { saveAddressSnapshot } from "./entities/addressSnapshot";
import { ERC721VotesAbi } from "./ERC721VotesAbi";

export function makeERC721VotesIndexerDefinition(
  contractInstance: ContractInstance<AbiEventsMapping<typeof ERC721VotesAbi>>,
  name: string
) {
  return makeIndexerDefinition(contractInstance, erc721EntityDefinitions, {
    name,
    eventHandlers: {
      Transfer: {
        async handle(handle, [from, to, tokenId], log) {
          if (from === to) {
            return;
          }

          await Promise.all([
            updateTotalSupply(from, to, 1n, log, handle),
            (async () => {
              const fromEntity = await loadAccount(handle, from);

              fromEntity.tokensOwned -= 1n;
              fromEntity.tokensOwnedIds = fromEntity.tokensOwnedIds.filter(
                (it) => it !== tokenId
              );

              saveAccount(handle, fromEntity);

              const fromEntityDelegate = await loadAccount(
                handle,
                fromEntity.delegatingTo
              );

              fromEntityDelegate.tokensRepresentedIds = subtractItems(
                fromEntityDelegate.tokensRepresentedIds,
                [tokenId]
              );

              saveAccount(handle, fromEntityDelegate);
              saveAddressSnapshot(handle, fromEntityDelegate, log);
            })(),

            (async () => {
              const toEntity = await loadAccount(handle, to);

              toEntity.tokensOwned += 1n;
              toEntity.tokensOwnedIds = [...toEntity.tokensOwnedIds, tokenId];

              saveAccount(handle, toEntity);

              const toEntityDelegate = await loadAccount(
                handle,
                toEntity.delegatingTo
              );

              toEntityDelegate.tokensRepresentedIds = unionItems(
                toEntityDelegate.tokensRepresentedIds,
                [tokenId]
              );

              saveAccount(handle, toEntityDelegate);
              saveAddressSnapshot(handle, toEntityDelegate, log);
            })(),
          ]);
        },
      },
      DelegateVotesChanged: {
        async handle(handle, [delegate, previousBalance, newBalance]) {
          const account = await loadAccount(handle, delegate);

          if (account.tokensRepresented !== previousBalance) {
            throw new Error(
              `token balance incorrect. got ${account.tokensRepresented.toString()}, expected: ${previousBalance.toString()}`
            );
          }

          account.tokensRepresented = newBalance;

          const agg = await loadAggregate(handle);

          const change = newBalance - previousBalance;
          agg.delegatedSupply += change;

          saveAggregate(handle, agg);
          saveAccount(handle, account);
        },
      },
      DelegateChanged: {
        async handle(handle, [delegator, fromDelegate, toDelegate], log) {
          if (fromDelegate === toDelegate) {
            return;
          }

          const delegatorAccount = await loadAccount(handle, delegator);

          if (
            delegatorAccount.delegatingTo !== ethers.constants.AddressZero &&
            delegatorAccount.delegatingTo !== fromDelegate
          ) {
            throw new Error("mismatched from address");
          }

          delegatorAccount.delegatingTo = toDelegate;

          saveAccount(handle, delegatorAccount);

          await Promise.all([
            (async () => {
              if (fromDelegate !== ethers.constants.AddressZero) {
                const fromAccount = await loadAccount(handle, fromDelegate);

                fromAccount.accountsRepresentedCount -= 1n;
                fromAccount.tokensRepresentedIds = subtractItems(
                  fromAccount.tokensRepresentedIds,
                  delegatorAccount.tokensOwnedIds
                );

                saveAccount(handle, fromAccount);
                saveAddressSnapshot(handle, fromAccount, log);
              }
            })(),
            (async () => {
              if (toDelegate !== ethers.constants.AddressZero) {
                const toAccount = await loadAccount(handle, toDelegate);

                toAccount.accountsRepresentedCount += 1n;
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
    },
  });
}
