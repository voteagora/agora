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

export const governorTokenContract = makeContractInstance({
  iface: OptimismGovernorV1__factory.createInterface(),
  address: "0x4200dfa134da52d9c96f523af1fcb507199b1042",
  startingBlock: 60786205,
});

// todo: entity name collisions (should scope these to avoid)
// todo: derived state computation and change detection (like proposal status)

export const governorIndexer = makeIndexerDefinition(governorTokenContract, {
  name: "OptimismGovernorV1",
  entities: {
    GovernorAggregates: makeEntityDefinition({
      serde: serde.object({
        quorumNumerator: serde.bigNumber,
        votingDelay: serde.bigNumber,
        votingPeriod: serde.bigNumber,
        proposalThreshold: serde.bigNumber,
      }),
    }),
    Vote: makeEntityDefinition({
      serde: serde.object({
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
              value: event.args.values[idx],
              calldata: event.args.calldatas[idx],
            };
          }),
          status: "PROPOSED",
          startBlock: event.args.startBlock,
          endBlock: event.args.endBlock,
          description: event.args.description,
        });
      },
    },
    {
      signature: "ProposalDeadlineUpdated(uint256,uint64)",
      async handle(handle, event) {
        const proposal = await handle.loadEntity(
          "Proposal",
          event.args.proposalId.toString()
        );

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
        const proposal = await handle.loadEntity(
          "Proposal",
          event.args.proposalId.toString()
        );

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
        const proposal = await handle.loadEntity(
          "Proposal",
          event.args.proposalId.toString()
        );

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
        handle.saveEntity(
          "Vote",
          [log.transactionHash, log.logIndex].join("|"),
          {
            voterAddress: event.args.voter,
            proposalId: event.args.proposalId,
            support: event.args.support,
            weight: event.args.weight,
            reason: event.args.reason,
          }
        );
      },
    },
    {
      signature:
        "VoteCastWithParams(address,uint256,uint8,uint256,string,bytes)",
      async handle(handle, event, log) {
        handle.saveEntity(
          "Vote",
          [log.transactionHash, log.logIndex].join("|"),
          {
            voterAddress: event.args.voter,
            proposalId: event.args.proposalId,
            support: event.args.support,
            weight: event.args.weight,
            reason: event.args.reason,
          }
        );
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

const aggregateKey = "AGGREGATE";

async function loadAggregate(
  handle: StorageHandleForIndexer<typeof governorIndexer>
) {
  const aggregates = await handle.loadEntity(
    "GovernorAggregates",
    aggregateKey
  );

  return (
    aggregates ?? {
      proposalThreshold: ethers.BigNumber.from(0),
      quorumNumerator: ethers.BigNumber.from(0),
      votingDelay: ethers.BigNumber.from(0),
      votingPeriod: ethers.BigNumber.from(0),
    }
  );
}

function saveAggregate(
  handle: StorageHandleForIndexer<typeof governorIndexer>,
  entity: RuntimeType<
    typeof governorIndexer["entities"]["GovernorAggregates"]["serde"]
  >
) {
  handle.saveEntity("GovernorAggregates", aggregateKey, entity);
}
