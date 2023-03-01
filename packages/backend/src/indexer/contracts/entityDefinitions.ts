import {
  makeEntityDefinition,
  StorageHandleForEntityDefinition,
} from "../process";
import * as serde from "../serde";
import { makeCompoundKey } from "../indexKey";
import { efficientLengthEncodingNaturalNumbers } from "../utils/efficientLengthEncoding";

export type Handle = StorageHandleForEntityDefinition<typeof entityDefinitions>;

export const entityDefinitions = {
  GovernorAggregates: makeEntityDefinition({
    serde: serde.object({
      quorumNumerator: serde.bigNumber,
      votingDelay: serde.bigNumber,
      votingPeriod: serde.bigNumber,
      totalProposals: serde.passthrough<number>(),
      quorumFloorBps: serde.number,
      quorumCeilingBps: serde.number,
      proposalThresholdBps: serde.bigNumber,
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
      blockNumber: serde.number,
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
          signature: serde.string,
        })
      ),
      status: serde.passthrough<"PROPOSED" | "CANCELLED" | "EXECUTED">(),
      startBlock: serde.bigNumber,
      endBlock: serde.bigNumber,
      description: serde.string,

      snapshot: serde.object({
        totalSupply: serde.bigNumber,
      }),

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
          return efficientLengthEncodingNaturalNumbers(entity.endBlock.mul(-1));
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

  Noun: makeEntityDefinition({
    serde: serde.object({
      tokenId: serde.bigNumber,
      background: serde.number,
      body: serde.number,
      accessory: serde.number,
      head: serde.number,
      glasses: serde.number,
    }),
    indexes: [],
  }),

  Aggregates: makeEntityDefinition({
    serde: serde.object({
      totalSupply: serde.bigNumber,
      delegatedSupply: serde.bigNumber,
    }),
    indexes: [],
  }),

  Address: makeEntityDefinition({
    serde: serde.object({
      address: serde.string,
      tokensOwned: serde.bigNumber,
      tokensOwnedIds: serde.array(serde.bigNumber),
      tokensRepresented: serde.bigNumber,
      delegatingTo: serde.string,
      accountsRepresentedCount: serde.bigNumber,
      votesCast: serde.bigNumber,
    }),
    indexes: [
      {
        indexName: "byTokensOwned",
        indexKey(entity) {
          return efficientLengthEncodingNaturalNumbers(
            entity.tokensOwned.mul(-1)
          );
        },
      },
      {
        indexName: "byTokensRepresented",
        indexKey(entity) {
          return efficientLengthEncodingNaturalNumbers(
            entity.tokensRepresented.mul(-1)
          );
        },
      },
      {
        indexName: "byTokenHoldersRepresented",
        indexKey(entity) {
          return efficientLengthEncodingNaturalNumbers(
            entity.accountsRepresentedCount.mul(-1)
          );
        },
      },
      {
        indexName: "byDelegatingTo",
        indexKey(entity) {
          return entity.delegatingTo;
        },
      },
      {
        indexName: "byVotesCastDesc",
        indexKey(entity) {
          return efficientLengthEncodingNaturalNumbers(
            entity.votesCast.mul(-1)
          );
        },
      },
      {
        indexName: "byVotesCastAsc",
        indexKey(entity) {
          return efficientLengthEncodingNaturalNumbers(entity.votesCast);
        },
      },
    ],
  }),
};
