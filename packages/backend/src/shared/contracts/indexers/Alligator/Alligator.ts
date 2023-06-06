import {
  AbiEventsMapping,
  ContractInstance,
} from "../../../indexer/process/contractInstance";
import { makeIndexerDefinition } from "../../../indexer";

import { AlligatorAbi } from "./AlligatorAbi";
import { toRules } from "./entities/rules";
import {
  alligatorEntityDefinitions,
  storeSubdelegation,
} from "./entities/entities";

export function makeAlligatorIndexer(
  contract: ContractInstance<AbiEventsMapping<typeof AlligatorAbi>>,
  name: string
) {
  return makeIndexerDefinition(contract, alligatorEntityDefinitions, {
    name,
    eventHandlers: {
      ProxyDeployed: {
        handle(handle, [owner, proxy]) {
          handle.saveEntity("AlligatorProxy", proxy, {
            owner,
            proxy,
          });
        },
      },
      SubDelegations: {
        handle(handle, [from, tos, rules]) {
          for (const [idx, to] of tos.entries()) {
            storeSubdelegation(handle, from, to, toRules(rules[idx]));
          }
        },
      },
      SubDelegation: {
        handle(handle, [from, to, rules]) {
          storeSubdelegation(handle, from, to, toRules(rules));
        },
      },
      VoteCast: {
        async handle(handle, [proxy, voter, _athority, proposalId, _support]) {
          {
            const voteId = [proposalId.toString(), proxy].join("-");
            const vote = await handle.getEntity("IGovernorVote", voteId);
            if (vote) {
              handle.saveEntity("IGovernorVote", voteId, {
                ...vote,
                executorAddress: voter,
              });
            }
          }
        },
      },
      // Voter actually comes in first eventhough it's the second argument in the Event signature
      VotesCast: {
        async handle(
          handle,
          [voter, proxies, _athorities, proposalId, _support]
        ) {
          // Because proxies is acutally an array of proxies
          if (Array.isArray(proxies)) {
            for (const proxy of proxies) {
              const voteId = [proposalId.toString(), proxy].join("-");
              const vote = await handle.getEntity("IGovernorVote", voteId);
              if (vote) {
                handle.saveEntity("IGovernorVote", voteId, {
                  ...vote,
                  executorAddress: [voter].flat()[0],
                });
              }
            }
          } else {
            const voteId = [proposalId.toString(), proxies].join("-");
            const vote = await handle.getEntity("IGovernorVote", voteId);
            if (vote) {
              handle.saveEntity("IGovernorVote", voteId, {
                ...vote,
                executorAddress: [voter].flat()[0],
              });
            }
          }
        },
      },
    },
  });
}
