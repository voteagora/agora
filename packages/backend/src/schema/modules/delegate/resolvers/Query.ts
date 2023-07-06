import { Resolvers } from "../module";
import { driveReaderByIndex } from "../../../../shared/schema/pagination";
import { makeCompoundKey } from "../../../../shared/indexer/storage/keys/indexKey";
import { loadProposal } from "../../../../shared/contracts/indexers/IGovernor/entities/proposal";
import { collectGenerator } from "../../../../shared/utils/generatorUtils";

export const Query: Resolvers["Query"] = {
  async votes(_, { proposalId, orderBy, first, after }, { reader }) {
    return driveReaderByIndex(
      reader,
      "IGovernorVote",
      (() => {
        switch (orderBy) {
          case "mostRecent":
            return "byProposalByBlock";
          case "mostVotes":
            return "byProposalByVotes";
          default:
            throw new Error("unknown order by");
        }
      })(),
      first,
      after ?? null,
      {
        indexKey: makeCompoundKey(proposalId.toString(), ""),
      }
    );
  },

  async onChainProposal(_, { id }, { reader }) {
    return loadProposal(reader, BigInt(id));
  },

  async onChainProposals(_parent, _args, { reader }) {
    return (
      await collectGenerator(
        reader.getEntitiesByIndex("IGovernorProposal", "byEndBlock", {})
      )
    ).map((it) => it.value);
  },

  async delegate(_, { addressOrEnsName }, { reader, nameResolver }) {
    const address = await nameResolver.resolveAddress(addressOrEnsName);
    if (!address) {
      throw new Error("failed to resolve address");
    }

    return {
      address,
    };
  },

  async delegates(_, { orderBy, first, where, after }, { delegatesLoader }) {
    return await delegatesLoader.loadDelegates({
      after: after ?? null,
      first,
      orderBy,
    });
  },
};
