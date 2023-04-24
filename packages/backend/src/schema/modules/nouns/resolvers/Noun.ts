import { EntityRuntimeType } from "../../../../shared/indexer/process/process";
import { Resolvers } from "../module";
import { Noun as NounEntity } from "../../../../deployments/nouns/indexers/NounsToken/entities/noun";

export type NounModel = EntityRuntimeType<typeof NounEntity>;

export const Noun: Resolvers["Noun"] = {
  id({ tokenId }) {
    return `Noun|${tokenId.toString()}`;
  },
};
