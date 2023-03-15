import { BigNumber } from "ethers";
import { makeContractInstance } from "../../contracts";
import { NounsDAOLogicV2__factory } from "../../contracts/generated";
import { makeIndexerDefinition } from "../process";
import { RuntimeType } from "../serde";
import { StorageHandle } from "../storageHandle";
import { loadAccount, loadAggregate, saveAccount } from "./NounsToken";
import { entityDefinitions, Handle } from "./entityDefinitions";

export const daoContract = makeContractInstance({
  iface: NounsDAOLogicV2__factory.createInterface(),
  address: "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d",
  startingBlock: 12985453,
});

export const governorIndexer = makeIndexerDefinition(
  daoContract,
  entityDefinitions,
  {
    name: "NounsDAO",
    eventHandlers: [
      {
        signature: "ProposalThresholdBPSSet(uint256,uint256)",
        async handle(handle, event) {
          const agg = await loadGovernanceAggregate(handle);

          agg.proposalThresholdBps = event.args.newProposalThresholdBPS;
          saveGovernanceAggregate(handle, agg);
        },
      },
      {
        signature: "MinQuorumVotesBPSSet(uint16,uint16)",
        async handle(handle, event) {
          const agg = await loadGovernanceAggregate(handle);

          agg.quorumFloorBps = event.args.newMinQuorumVotesBPS;
          saveGovernanceAggregate(handle, agg);
        },
      },
      {
        signature: "MaxQuorumVotesBPSSet(uint16,uint16)",
        async handle(handle, event) {
          const agg = await loadGovernanceAggregate(handle);

          agg.quorumCeilingBps = event.args.newMaxQuorumVotesBPS;

          saveGovernanceAggregate(handle, agg);
        },
      },
      {
        signature:
          "ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)",
        async handle(handle, event) {
          const sharedHandle: StorageHandle<typeof entityDefinitions> = handle;

          const aggregate = await loadAggregate(sharedHandle);

          handle.saveEntity("Proposal", event.args.id.toString(), {
            proposalId: event.args.id,
            proposer: event.args.proposer,
            transactions: event.args.targets.map((target, idx) => {
              return {
                target,
                signature: event.args.signatures[idx],
                value: event.args[3][idx],
                calldata: event.args.calldatas[idx],
              };
            }),
            status: "PROPOSED",
            startBlock: event.args.startBlock,
            endBlock: event.args.endBlock,
            description: event.args.description,

            snapshot: {
              totalSupply: aggregate.totalSupply,
            },

            aggregates: {
              forVotes: BigNumber.from(0),
              abstainVotes: BigNumber.from(0),
              againstVotes: BigNumber.from(0),
            },
          });

          const agg = await loadGovernanceAggregate(handle);
          agg.totalProposals++;
          saveGovernanceAggregate(handle, agg);
        },
      },
      {
        signature: "ProposalCanceled(uint256)",
        async handle(handle, event) {
          const proposal = (await handle.loadEntity(
            "Proposal",
            event.args.id.toString()
          ))!;

          proposal.status = "CANCELLED";

          handle.saveEntity("Proposal", event.args.id.toString(), proposal);
        },
      },
      {
        signature: "ProposalExecuted(uint256)",
        async handle(handle, event) {
          const proposal = (await handle.loadEntity(
            "Proposal",
            event.args.id.toString()
          ))!;

          proposal.status = "EXECUTED";

          handle.saveEntity("Proposal", event.args.id.toString(), proposal);
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
                supportType === "FOR" ? event.args.votes : 0
              ),
              againstVotes: proposal.aggregates.againstVotes.add(
                supportType === "AGAINST" ? event.args.votes : 0
              ),
              abstainVotes: proposal.aggregates.abstainVotes.add(
                supportType === "ABSTAIN" ? event.args.votes : 0
              ),
            },
          });

          const voter = await loadAccount(handle, event.args.voter);
          voter.votesCast = voter.votesCast.add(1);
          saveAccount(handle, voter);

          const voteId = [
            event.args.proposalId.toString(),
            event.args.voter,
          ].join("-");
          handle.saveEntity("Vote", voteId, {
            id: voteId,
            voterAddress: event.args.voter,
            proposalId: event.args.proposalId,
            support: event.args.support,
            weight: event.args.votes,
            reason: (() => {
              try {
                return event.args.reason;
              } catch (e) {
                // todo: warn somewhere more visible
                console.warn(e);
                return "";
              }
            })(),
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        },
      },
      {
        signature: "VotingDelaySet(uint256,uint256)",
        async handle(handle, event) {
          const aggregate = await loadGovernanceAggregate(handle);
          if (!aggregate.votingDelay.eq(event.args.oldVotingDelay)) {
            throw new Error("votingDelay wrong");
          }

          aggregate.votingDelay = event.args.newVotingDelay;
          saveGovernanceAggregate(handle, aggregate);
        },
      },
      {
        signature: "VotingPeriodSet(uint256,uint256)",
        async handle(handle, event) {
          const aggregate = await loadGovernanceAggregate(handle);
          if (!aggregate.votingPeriod.eq(event.args.oldVotingPeriod)) {
            throw new Error("votingPeriod wrong");
          }

          aggregate.votingPeriod = event.args.newVotingPeriod;
          saveGovernanceAggregate(handle, aggregate);
        },
      },
    ],
  }
);

export const governanceAggregatesKey = "AGGREGATE";

export function makeDefaultGovernanceAggregate(): RuntimeType<
  typeof entityDefinitions["GovernorAggregates"]["serde"]
> {
  return {
    votingDelay: BigNumber.from(0),
    votingPeriod: BigNumber.from(0),
    totalProposals: 0,
    quorumFloorBps: 1,
    quorumCeilingBps: 1,
    proposalThresholdBps: BigNumber.from(0),
  };
}

async function loadGovernanceAggregate(
  handle: Handle
): Promise<
  RuntimeType<typeof entityDefinitions["GovernorAggregates"]["serde"]>
> {
  const aggregates = await handle.loadEntity(
    "GovernorAggregates",
    governanceAggregatesKey
  );

  return aggregates ?? makeDefaultGovernanceAggregate();
}

function saveGovernanceAggregate(
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

export function totalVotes({
  forVotes,
  againstVotes,
  abstainVotes,
}: {
  forVotes: BigNumber;
  againstVotes: BigNumber;
  abstainVotes: BigNumber;
}): BigNumber {
  return forVotes.add(againstVotes).add(abstainVotes);
}
