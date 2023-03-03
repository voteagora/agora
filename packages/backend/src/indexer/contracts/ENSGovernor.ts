import { ethers } from "ethers";
import { makeContractInstance } from "../../contracts";
import { ENSGovernor__factory } from "../../contracts/generated/factories/ENSGovernor__factory";
import { makeIndexerDefinition } from "../process";
import { RuntimeType } from "../serde";
import { defaultAccount } from "./GovernanceToken";
import { entityDefinitions, Handle, saveAccount } from "./entityDefinitions";

export const governorTokenContract = makeContractInstance({
  iface: ENSGovernor__factory.createInterface(),
  address: "0x323A76393544d5ecca80cd6ef2A560C6a395b7E3",
  startingBlock: 13533772,
});

export const governorIndexer = makeIndexerDefinition(
  governorTokenContract,
  entityDefinitions,
  {
    name: "ENSGovernor",
    eventHandlers: [
      {
        signature:
          "ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)",
        async handle(handle, event) {
          handle.saveEntity("Proposal", event.args.proposalId.toString(), {
            proposalId: event.args.proposalId,
            proposer: event.args.proposer,
            transactions: event.args.targets.map((target, idx) => {
              return {
                target,
                value: event.args[3][idx],
                calldata: event.args.calldatas[idx],
              };
            }),
            status: "PROPOSED" as any,
            startBlock: event.args.startBlock,
            endBlock: event.args.endBlock,
            description: event.args.description,

            aggregates: {
              forVotes: ethers.BigNumber.from(0),
              abstainVotes: ethers.BigNumber.from(0),
              againstVotes: ethers.BigNumber.from(0),
            },
          });

          const agg = await loadAggregate(handle);
          agg.totalProposals++;
          saveAggregate(handle, agg);
        },
      },
      {
        signature: "ProposalCanceled(uint256)",
        async handle(handle, event) {
          const proposal = (await handle.loadEntity(
            "Proposal",
            event.args.proposalId.toString()
          ))!;

          proposal.status = "CANCELLED";

          handle.saveEntity(
            "Proposal",
            event.args.proposalId.toString(),
            proposal
          );
        },
      },
      {
        signature: "ProposalExecuted(uint256)",
        async handle(handle, event) {
          const proposal = (await handle.loadEntity(
            "Proposal",
            event.args.proposalId.toString()
          ))!;

          proposal.status = "EXECUTED";

          handle.saveEntity(
            "Proposal",
            event.args.proposalId.toString(),
            proposal
          );
        },
      },
      {
        signature: "VoteCast(address,uint256,uint8,uint256,string)",
        async handle(handle, event, log) {
          const proposalId = event.args.proposalId.toString();

          const proposal = await handle.loadEntity("Proposal", proposalId);
          if (!proposal) {
            throw new Error(
              `vote cast on non-existing proposal: ${proposalId}`
            );
          }

          const supportType = toSupportType(event.args.support);

          handle.saveEntity("Proposal", proposalId, {
            ...proposal,
            aggregates: {
              forVotes: proposal.aggregates.forVotes.add(
                supportType === "FOR" ? event.args.weight : 0
              ),
              againstVotes: proposal.aggregates.againstVotes.add(
                supportType === "AGAINST" ? event.args.weight : 0
              ),
              abstainVotes: proposal.aggregates.abstainVotes.add(
                supportType === "ABSTAIN" ? event.args.weight : 0
              ),
            },
          });

          const voteId = [log.transactionHash, log.logIndex].join("|");
          handle.saveEntity("Vote", voteId, {
            id: voteId,
            voterAddress: event.args.voter,
            proposalId: event.args.proposalId,
            support: event.args.support,
            weight: event.args.weight,
            reason: event.args.reason,
            transactionHash: log.transactionHash,
          });

          const account =
            (await await handle.loadEntity("Address", event.args.voter)) ??
            defaultAccount(event.args.voter);
          account.votesCasted = account.votesCasted.add(1);

          saveAccount(handle, account);
        },
      },
      {
        signature: "QuorumNumeratorUpdated(uint256,uint256)",
        async handle(handle, event) {
          const aggregate = await loadAggregate(handle);
          if (!aggregate.quorumNumerator.eq(event.args.oldQuorumNumerator)) {
            throw new Error("quorumNumerator wrong");
          }

          aggregate.quorumNumerator = event.args.newQuorumNumerator;
          saveAggregate(handle, aggregate);
        },
      },
    ],
  }
);

export const governanceAggregatesKey = "AGGREGATE";

export function makeDefaultGovernanceAggregate() {
  return {
    proposalThreshold: ethers.BigNumber.from(0),
    quorumNumerator: ethers.BigNumber.from(0),
    votingDelay: ethers.BigNumber.from(0),
    votingPeriod: ethers.BigNumber.from(0),
    totalProposals: 0,
  };
}

async function loadAggregate(
  // @ts-ignore
  handle: Handle
) {
  const aggregates = await handle.loadEntity(
    "GovernorAggregates",
    governanceAggregatesKey
  );

  return aggregates ?? makeDefaultGovernanceAggregate();
}

function saveAggregate(
  // @ts-ignore
  handle: Handle,
  entity: RuntimeType<typeof entityDefinitions["GovernorAggregates"]["serde"]>
) {
  handle.saveEntity("GovernorAggregates", governanceAggregatesKey, entity);
}

export function toSupportType(value: number): "FOR" | "AGAINST" | "ABSTAIN" {
  switch (value) {
    case 0:
      return "AGAINST";
    case 1:
      return "FOR";
    case 2:
      return "ABSTAIN";
    default:
      throw new Error(`unknown type ${value}`);
  }
}
