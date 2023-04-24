import { toSupportType } from "@agora/common/src/contracts/supportType";

import {
  AbiEventsMapping,
  ContractInstance,
} from "../../../indexer/process/contractInstance";
import { makeIndexerDefinition } from "../../../indexer";
import { loadAggregate } from "../IVotes/entities/aggregate";

import { IGovernorAbi } from "./IGovernorAbi";
import { IGovernorEntities } from "./entities";
import {
  loadProposal,
  saveProposal,
  updateProposalStatus,
} from "./entities/proposal";
import {
  loadGovernanceAggregate,
  saveGovernanceAggregate,
} from "./entities/aggregate";

export function makeGovernorIndexer(
  contractInstance: ContractInstance<AbiEventsMapping<typeof IGovernorAbi>>,
  name: string
) {
  return makeIndexerDefinition(contractInstance, IGovernorEntities, {
    name,
    eventHandlers: {
      ProposalCreated: {
        async handle(
          handle,
          [
            proposalId,
            proposer,
            targets,
            values,
            signatures,
            calldatas,
            startBlock,
            endBlock,
            description,
          ],
          log
        ) {
          const aggregate = await loadAggregate(handle);

          handle.saveEntity("IGovernorProposal", proposalId.toString(), {
            proposalId: proposalId,
            proposer,
            transactions: targets.map((target, idx) => {
              return {
                target,
                signature: signatures[idx],
                value: values[idx],
                calldata: calldatas[idx],
              };
            }),
            status: "PROPOSED",
            startBlock: startBlock,
            endBlock: endBlock,
            creationBlock: log.blockNumber,
            description: description,

            snapshot: {
              totalSupply: aggregate.totalSupply,
            },

            aggregates: {
              forVotes: 0n,
              abstainVotes: 0n,
              againstVotes: 0n,
            },
          });

          const agg = await loadGovernanceAggregate(handle);
          agg.totalProposals += 1;
          saveGovernanceAggregate(handle, agg);
        },
      },

      VoteCast: {
        async handle(
          handle,
          [voter, proposalId, support, weight, reason],
          log
        ) {
          {
            const proposal = await loadProposal(handle, proposalId);

            const supportType = toSupportType(support);

            switch (supportType) {
              case "FOR": {
                proposal.aggregates.forVotes += weight;
                break;
              }
              case "ABSTAIN": {
                proposal.aggregates.abstainVotes += weight;
                break;
              }
              case "AGAINST": {
                proposal.aggregates.againstVotes += weight;
                break;
              }
            }

            saveProposal(handle, proposal);
          }

          {
            const voteId = [proposalId.toString(), voter].join("-");
            handle.saveEntity("IGovernorVote", voteId, {
              id: voteId,
              voterAddress: voter,
              proposalId,
              support,
              weight,
              reason,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
            });
          }
        },
      },
      ProposalCanceled: {
        async handle(handle, [proposalId]) {
          await updateProposalStatus(handle, proposalId, "CANCELLED");
        },
      },
      ProposalExecuted: {
        async handle(handle, [proposalId]) {
          await updateProposalStatus(handle, proposalId, "EXECUTED");
        },
      },
    },
  });
}
