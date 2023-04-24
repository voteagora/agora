import { Address } from "viem";

import { collectGenerator } from "../../../../shared/utils/generatorUtils";
import { Resolvers } from "../module";
import {
  getSnapshotForAddress,
  IVotesAddressSnapshot,
} from "../../../../shared/contracts/indexers/ERC721Votes/entities/addressSnapshot";
import { Reader } from "../../../../shared/indexer/storage/reader/type";
import {
  IGovernorProposal,
  loadProposal,
} from "../../../../shared/contracts/indexers/IGovernor/entities/proposal";

export const DelegateSnapshot: Resolvers["DelegateSnapshot"] = {
  async nounsRepresented({ address, proposalId }, _args, { reader }) {
    const { tokensRepresentedIds } = await getSnapshotForAddressAndProposal(
      {
        address: address as Address,
        proposalId,
      },
      reader
    );

    return await collectGenerator(
      (async function* () {
        for (const tokenId of tokensRepresentedIds.map((it) => it.toString())) {
          const noun = await reader.getEntity("Noun", tokenId.toString());
          if (!noun) {
            continue;
          }

          yield noun;
        }
      })()
    );
  },
};

async function getSnapshotForAddressAndProposal(
  { address, proposalId }: { address: Address; proposalId: bigint },
  reader: Reader<{
    IGovernorProposal: typeof IGovernorProposal;
    IVotesAddressSnapshot: typeof IVotesAddressSnapshot;
  }>
) {
  const proposal = await loadProposal(reader, proposalId);
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  return await getSnapshotForAddress(
    { address, startBlock: proposal.startBlock },
    reader
  );
}
