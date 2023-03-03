import {
  makeEntityDefinition,
  StorageHandleForEntityDefinition,
} from "../process";
import * as serde from "../serde";
import { makeCompoundKey } from "../indexKey";
import { efficientLengthEncodingNaturalNumbers } from "../utils/efficientLengthEncoding";
import { RuntimeType } from "../serde";

export type Handle = StorageHandleForEntityDefinition<typeof entityDefinitions>;

export function saveAccount(
  // @ts-ignore
  handle: Handle,
  entity: RuntimeType<
    typeof entityDefinitions["Address"]["serde"]
  >
) {
  return handle.saveEntity("Address", entity.address, entity);
}

export const entityDefinitions = {
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
  Address: makeEntityDefinition({
    serde: serde.object({
      address: serde.string,
      tokensOwned: serde.bigNumber,
      tokensRepresented: serde.bigNumber,
      delegatingTo: serde.string,
      accountsRepresentedCount: serde.bigNumber,
      votesCasted: serde.bigNumber,
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
        indexName: "byVotesCasted",
        indexKey(entity) {
          return efficientLengthEncodingNaturalNumbers(
            entity.votesCasted.mul(-1)
          );
        },
      },
      {
        indexName: "byVotesCastedByTokensRepresented",
        indexKey(entity) {
          return makeCompoundKey(
            efficientLengthEncodingNaturalNumbers(entity.votesCasted.mul(-1)),
            efficientLengthEncodingNaturalNumbers(entity.tokensRepresented.mul(-1))
          );
        },
      },
    ],
  }),

  Aggregates: makeEntityDefinition({
    serde: serde.object({
      totalSupply: serde.bigNumber,
      delegatedSupply: serde.bigNumber,
    }),
    indexes: [],
  }),
};
