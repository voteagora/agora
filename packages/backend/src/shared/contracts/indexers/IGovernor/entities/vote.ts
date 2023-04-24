import { ethers } from "ethers";

import { makeEntityDefinition, serde } from "../../../../indexer";
import { makeCompoundKey } from "../../../../indexer/storage/keys/indexKey";
import { efficientLengthEncodingNaturalNumbers } from "../../../../utils/efficientLengthEncoding";
import { exactIndexValue } from "../../../../indexer/storage/indexQueryArgs";
import {
  collectGenerator,
  mapGenerator,
} from "../../../../utils/generatorUtils";
import { Reader } from "../../../../indexer/storage/reader/type";

export const IGovernorVote = makeEntityDefinition({
  serde: serde.object({
    id: serde.string,
    voterAddress: serde.string,
    proposalId: serde.bigint,
    support: serde.number,
    weight: serde.bigint,
    reason: serde.string,
    transactionHash: serde.string,
    blockNumber: serde.number,
  }),
  indexes: {
    byProposalByVotes: {
      indexKey(entity) {
        return makeCompoundKey(
          entity.proposalId.toString(),
          efficientLengthEncodingNaturalNumbers(
            ethers.BigNumber.from(entity.weight).mul(-1)
          )
        );
      },
    },
    byVoter: {
      indexKey(entity) {
        return entity.voterAddress;
      },
    },
  },
});

type EntityTypes = {
  IGovernorVote: typeof IGovernorVote;
};

export async function votesForAddress(
  reader: Reader<EntityTypes>,
  address: string
) {
  return await collectGenerator(
    mapGenerator(
      reader.getEntitiesByIndex(
        "IGovernorVote",
        "byVoter",
        exactIndexValue(address)
      ),
      (it) => it.value
    )
  );
}
