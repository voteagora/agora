import { makeEntityDefinition, serde } from "../../../../../shared/indexer";

export const Noun = makeEntityDefinition({
  serde: serde.object({
    tokenId: serde.bigint,
    background: serde.number,
    body: serde.number,
    accessory: serde.number,
    head: serde.number,
    glasses: serde.number,
  }),
  indexes: {},
});
