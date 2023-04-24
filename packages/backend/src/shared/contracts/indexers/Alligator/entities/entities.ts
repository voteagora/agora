import { Address } from "viem";

import { makeEntityDefinition, serde } from "../../../../indexer";
import { StorageHandle } from "../../../../indexer/process/storageHandle";

import { rules, RulesType } from "./rules";

const AlligatorSubDelegation = makeEntityDefinition({
  serde: serde.object({
    from: serde.string,
    to: serde.string,
    rules,
  }),
  indexes: {
    byFrom: {
      indexKey(entity) {
        return entity.from;
      },
    },

    byTo: {
      indexKey(entity) {
        return entity.to;
      },
    },
  },
});
export const alligatorEntityDefinitions = {
  AlligatorProxy: makeEntityDefinition({
    serde: serde.object({
      owner: serde.string,
      proxy: serde.string,
    }),
    indexes: {
      byOwner: {
        indexKey(entity) {
          return entity.owner;
        },
      },
    },
  }),

  AlligatorSubDelegation,
};

export function storeSubdelegation(
  handle: StorageHandle<{
    AlligatorSubDelegation: typeof AlligatorSubDelegation;
  }>,
  from: Address,
  to: Address,
  rules: RulesType
) {
  handle.saveEntity("AlligatorSubDelegation", [from, to].join("-"), {
    from,
    to,
    rules,
  });
}
