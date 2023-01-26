import { ethers } from "ethers";
import { makeContractInstance } from "../../contracts";
import { OptimismGovernorV1__factory } from "../../contracts/generated";
import {
  makeEntityDefinition,
  makeIndexerDefinition,
  StorageHandleForIndexer,
} from "../process";
import * as serde from "../serde";
import { RuntimeType } from "../serde";
import { efficientLengthEncodingNaturalNumbers } from "../utils/efficientLengthEncoding";

export const governorTokenContract = makeContractInstance({
  iface: OptimismGovernorV1__factory.createInterface(),
  address: "0x4200dfa134da52d9c96f523af1fcb507199b1042",
  startingBlock: 60786205,
});

export const governorIndexer = makeIndexerDefinition(governorTokenContract, {
  name: "OptimismGovernorV1",
  entities: {
    GovernorAggregates: makeEntityDefinition({
      serde: serde.object({
        quorumNumerator: serde.bigNumber,
        votingDelay: serde.bigNumber,
        votingPeriod: serde.bigNumber,
        proposalThreshold: serde.bigNumber,
        totalProposals: serde.passthrough<number>(),
      }),
      indexes: [],
    }),
    Vote: makeEntityDefinition({
      serde: serde.object({
        id: serde.string,
        voterAddress: serde.string,
        proposalId: serde.bigNumber,
        support: serde.number,
        weight: serde.bigNumber,
        reason: serde.string,
      }),
      indexes: [
        {
          indexName: "byProposal",
          indexKey(entity) {
            return entity.proposalId.toString();
          },
        },
        {
          indexName: "byVoter",
          indexKey(entity) {
            return entity.voterAddress;
          },
        },
      ],
    }),
    Proposal: makeEntityDefinition({
      serde: serde.object({
        proposalId: serde.bigNumber,
        proposer: serde.string,
        transactions: serde.array(
          serde.object({
            target: serde.string,
            value: serde.bigNumber,
            calldata: serde.string,
          })
        ),
        status: serde.passthrough<"PROPOSED" | "CANCELLED" | "EXECUTED">(),
        startBlock: serde.bigNumber,
        endBlock: serde.bigNumber,
        description: serde.string,
      }),
      indexes: [
        {
          indexName: "byEndBlock",
          indexKey(entity) {
            return efficientLengthEncodingNaturalNumbers(
              entity.endBlock.mul(-1)
            );
          },
        },
        {
          indexName: "byProposer",
          indexKey(entity) {
            return entity.proposer;
          },
        },
      ],
    }),
  },
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
          status: "PROPOSED",
          startBlock: event.args.startBlock,
          endBlock: event.args.endBlock,
          description: event.args.description,
        });

        const agg = await loadAggregate(handle);
        agg.totalProposals++;
        saveAggregate(handle, agg);
      },
    },
    {
      signature: "ProposalDeadlineUpdated(uint256,uint64)",
      async handle(handle, event) {
        const proposal = (await handle.loadEntity(
          "Proposal",
          event.args.proposalId.toString()
        ))!;

        proposal.endBlock = event.args.deadline;

        handle.saveEntity(
          "Proposal",
          event.args.proposalId.toString(),
          proposal
        );
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
        const id = [log.transactionHash, log.logIndex].join("|");
        handle.saveEntity("Vote", id, {
          id,
          voterAddress: event.args.voter,
          proposalId: event.args.proposalId,
          support: event.args.support,
          weight: event.args.weight,
          reason: event.args.reason,
        });
      },
    },
    {
      signature:
        "VoteCastWithParams(address,uint256,uint8,uint256,string,bytes)",
      async handle(handle, event, log) {
        const id = [log.transactionHash, log.logIndex].join("|");
        handle.saveEntity("Vote", id, {
          id,
          voterAddress: event.args.voter,
          proposalId: event.args.proposalId,
          support: event.args.support,
          weight: event.args.weight,
          reason: event.args.reason,
        });
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
    {
      signature: "VotingDelaySet(uint256,uint256)",
      async handle(handle, event) {
        const aggregate = await loadAggregate(handle);
        if (!aggregate.votingDelay.eq(event.args.oldVotingDelay)) {
          throw new Error("quorumNumerator wrong");
        }

        aggregate.votingDelay = event.args.newVotingDelay;
        saveAggregate(handle, aggregate);
      },
    },
    {
      signature: "VotingPeriodSet(uint256,uint256)",
      async handle(handle, event) {
        const aggregate = await loadAggregate(handle);
        if (!aggregate.votingPeriod.eq(event.args.oldVotingPeriod)) {
          throw new Error("quorumNumerator wrong");
        }

        aggregate.votingPeriod = event.args.newVotingPeriod;
        saveAggregate(handle, aggregate);
      },
    },
    {
      signature: "ProposalThresholdSet(uint256,uint256)",
      async handle(handle, event) {
        const aggregate = await loadAggregate(handle);
        if (!aggregate.proposalThreshold.eq(event.args.oldProposalThreshold)) {
          throw new Error("quorumNumerator wrong");
        }

        aggregate.proposalThreshold = event.args.newProposalThreshold;
        saveAggregate(handle, aggregate);
      },
    },
  ],
});

export const governanceAggregatesKey = "AGGREGATE";

export function makeEmptyAggregate() {
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
  handle: StorageHandleForIndexer<typeof governorIndexer>
) {
  const aggregates = await handle.loadEntity(
    "GovernorAggregates",
    governanceAggregatesKey
  );

  return aggregates ?? makeEmptyAggregate();
}

function saveAggregate(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof governorIndexer>,
  entity: RuntimeType<
    typeof governorIndexer["entities"]["GovernorAggregates"]["serde"]
  >
) {
  handle.saveEntity("GovernorAggregates", governanceAggregatesKey, entity);
}
