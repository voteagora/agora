import { ethers } from "ethers";
import { makeContractInstance } from "../../contracts";
import { ENSGovernor__factory } from "../../contracts/generated/factories/ENSGovernor__factory";
import {
  makeEntityDefinition,
  makeIndexerDefinition,
  StorageHandleForIndexer,
} from "../process";
import * as serde from "../serde";
import { RuntimeType } from "../serde";
import { efficientLengthEncodingNaturalNumbers } from "../utils/efficientLengthEncoding";
import { makeCompoundKey } from "../indexKey";

export const governorTokenContract = makeContractInstance({
  iface: ENSGovernor__factory.createInterface(),
  address: "0x323A76393544d5ecca80cd6ef2A560C6a395b7E3",
  startingBlock: 13533772,
});

export const governorIndexer = makeIndexerDefinition(governorTokenContract, {
  name: "ENSGovernor",
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
        transactionHash: serde.string,
      }),
      indexes: [
        {
          indexName: "byProposalByVotes",
          indexKey(entity) {
            return makeCompoundKey(
              entity.proposalId.toString(),
              efficientLengthEncodingNaturalNumbers(entity.weight.mul(-1))
            );
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

        aggregates: serde.object({
          forVotes: serde.bigNumber,
          abstainVotes: serde.bigNumber,
          againstVotes: serde.bigNumber,
        }),
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
          event.args.proposalId.toString()
        ))!;

        proposal.status = "EXECUTED";

        handle.saveEntity("Proposal", event.args.proposalId.toString(), proposal);
      },
    },
    {
      signature: "VoteCast(address,uint256,uint8,uint256,string)",
      async handle(handle, event, log) {
        const proposalId = event.args.proposalId.toString();

        const proposal = await handle.loadEntity("Proposal", proposalId);
        if (!proposal) {
          throw new Error(`vote cast on non-existing proposal: ${proposalId}`);
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
});

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
  handle: StorageHandleForIndexer<typeof governorIndexer>
) {
  const aggregates = await handle.loadEntity(
    "GovernorAggregates",
    governanceAggregatesKey
  );

  return aggregates ?? makeDefaultGovernanceAggregate();
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