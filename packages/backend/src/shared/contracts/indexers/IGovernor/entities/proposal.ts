import { BigNumber } from "ethers";

import { makeEntityDefinition, serde } from "../../../../indexer";
import { efficientLengthEncodingNaturalNumbers } from "../../../../utils/efficientLengthEncoding";
import { StorageHandle } from "../../../../indexer/process/storageHandle";
import { EntityRuntimeType } from "../../../../indexer/process/process";
import { exactIndexValue } from "../../../../indexer/storage/indexQueryArgs";
import {
  collectGenerator,
  mapGenerator,
} from "../../../../utils/generatorUtils";
import { QuorumFetcher } from "../../../../schema/context/quorumFetcher";
import {
  Reader,
  ReaderEntities,
} from "../../../../indexer/storage/reader/type";

export const IGovernorProposal = makeEntityDefinition({
  serde: serde.object({
    proposalId: serde.bigint,
    proposer: serde.string,
    transactions: serde.array(
      serde.object({
        target: serde.string,
        value: serde.bigint,
        calldata: serde.string,
        signature: serde.string,
      })
    ),
    status: serde.passthrough<"PROPOSED" | "CANCELLED" | "EXECUTED">(),
    startBlock: serde.bigint,
    endBlock: serde.bigint,
    creationBlock: serde.number,
    description: serde.string,

    snapshot: serde.object({
      totalSupply: serde.bigint,
    }),

    aggregates: serde.object({
      forVotes: serde.bigint,
      abstainVotes: serde.bigint,
      againstVotes: serde.bigint,
    }),
  }),
  indexes: {
    byEndBlock: {
      indexKey(entity) {
        return efficientLengthEncodingNaturalNumbers(
          BigNumber.from(entity.endBlock).mul(-1)
        );
      },
    },
    byProposer: {
      indexKey(entity) {
        return entity.proposer;
      },
    },
  },
});

type EntityTypes = {
  IGovernorProposal: typeof IGovernorProposal;
};

function calculateIdentifier(proposalId: bigint) {
  return proposalId.toString();
}

export async function loadProposal(
  handle: ReaderEntities<EntityTypes>,
  proposalId: bigint
) {
  const proposal = await handle.getEntity(
    "IGovernorProposal",
    calculateIdentifier(proposalId)
  );

  if (!proposal) {
    throw new Error("proposal not found");
  }

  return proposal;
}

export function saveProposal(
  handle: StorageHandle<EntityTypes>,
  proposal: EntityRuntimeType<typeof IGovernorProposal>
) {
  handle.saveEntity(
    "IGovernorProposal",
    calculateIdentifier(proposal.proposalId),
    proposal
  );
}

export async function updateProposalStatus(
  handle: StorageHandle<EntityTypes>,
  proposalId: bigint,
  status: "CANCELLED" | "EXECUTED"
) {
  const proposal = await loadProposal(handle, proposalId);
  proposal.status = status;
  saveProposal(handle, proposal);
}

export async function proposedByAddress(
  reader: Reader<EntityTypes>,
  address: string
) {
  return collectGenerator(
    mapGenerator(
      reader.getEntitiesByIndex(
        "IGovernorProposal",
        "byProposer",
        exactIndexValue(address)
      ),
      (it) => it.value
    )
  );
}

export async function proposalStatus(
  {
    proposalId,
    status,
    startBlock,
    endBlock,
    aggregates,
  }: EntityRuntimeType<typeof IGovernorProposal>,
  currentBlockNumber: number,
  quorumFetcher: QuorumFetcher
) {
  switch (status) {
    case "CANCELLED": {
      return "CANCELLED";
    }

    case "EXECUTED": {
      return "EXECUTED";
    }

    case "PROPOSED": {
      if (currentBlockNumber <= Number(startBlock)) {
        return "PENDING";
      }

      if (currentBlockNumber <= Number(endBlock)) {
        return "ACTIVE";
      }

      const quorum = await quorumFetcher.fetchQuorum(proposalId);
      const { forVotes, abstainVotes, againstVotes } = aggregates;

      const proposalQuorumVotes = forVotes + abstainVotes;

      if (proposalQuorumVotes < quorum) {
        return "DEFEATED";
      }

      if (forVotes > againstVotes) {
        return "QUEUED";
      }

      return "DEFEATED";
    }
  }
}
