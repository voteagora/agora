import { ethers } from "ethers";

import {
  AbiEventsMapping,
  ContractInstance,
} from "../../../indexer/process/contractInstance";
import { makeIndexerDefinition } from "../../../indexer";
import { loadAggregate, saveAggregate } from "../IVotes/entities/aggregate";
import { updateTotalSupply } from "../IVotes/updateTotalSupply";

import { ERC20VotesAbi } from "./ERC20VotesAbi";
import { erc20EntityDefinitions } from "./entities";
import { loadAccount, saveAccount } from "./entities/address";

export function makeERC20VotesIndexerDefinition(
  contractInstance: ContractInstance<AbiEventsMapping<typeof ERC20VotesAbi>>,
  name: string
) {
  return makeIndexerDefinition(contractInstance, erc20EntityDefinitions, {
    name,
    eventHandlers: {
      Transfer: {
        async handle(handle, [from, to, value], log) {
          if (from === to) {
            return;
          }

          await updateTotalSupply(from, to, value, log, handle);

          const [fromEntity, toEntity] = await Promise.all([
            loadAccount(handle, from),
            loadAccount(handle, to),
          ]);

          fromEntity.tokensOwned += value;
          toEntity.tokensOwned += value;

          saveAccount(handle, fromEntity);
          saveAccount(handle, toEntity);
        },
      },
      DelegateVotesChanged: {
        async handle(handle, [delegate, previousBalance, newBalance]) {
          const account = await loadAccount(handle, delegate);

          if (account.tokensRepresented !== previousBalance) {
            throw new Error(
              `token balance incorrect. got ${account.tokensRepresented.toString()}, expected: ${previousBalance}`
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
        async handle(handle, [delegator, fromDelegate, toDelegate]) {
          if (fromDelegate === toDelegate) {
            return;
          }

          const delegatorAccount = await loadAccount(handle, delegator);

          if (delegatorAccount.delegatingTo !== fromDelegate) {
            throw new Error("mismatched from address");
          }

          delegatorAccount.delegatingTo = toDelegate;

          if (fromDelegate !== ethers.constants.AddressZero) {
            const fromAccount = await loadAccount(handle, fromDelegate);

            fromAccount.accountsRepresentedCount -= 1n;
            saveAccount(handle, fromAccount);
          }

          if (toDelegate !== ethers.constants.AddressZero) {
            const toAccount = await loadAccount(handle, toDelegate);

            toAccount.accountsRepresentedCount += 1n;

            saveAccount(handle, toAccount);
          }

          saveAccount(handle, delegatorAccount);
        },
      },
    },
  });
}
