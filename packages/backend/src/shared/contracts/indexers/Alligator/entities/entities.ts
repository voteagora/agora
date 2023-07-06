import { Address } from "viem";

import { IGovernorProposal } from "../../IGovernor/entities/proposal";
import { RuntimeType } from "../../../../indexer/serde";
import { flatMapGenerator } from "../../../../utils/generatorUtils";
import { makeEntityDefinition, serde } from "../../../../indexer";
import { StorageHandle } from "../../../../indexer/process/storageHandle";
import { IGovernorVote } from "../../IGovernor/entities/vote";
import { Reader } from "../../../../indexer/storage/reader/type";

import { rules, RulesType, PERMISSION_SIGN, PERMISSION_VOTE } from "./rules";
import { checkBlocksBeforeVoteCloses } from "./filterLots";
import { delegatedToLots, resolveLot } from "./lots";

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

  IGovernorVote,
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

export async function getLiquidDelegatatedVoteLotsForVoter(
  address: string,
  proposal: RuntimeType<typeof IGovernorProposal["serde"]>,
  latestBlock: number,
  reader: Reader<typeof alligatorEntityDefinitions>
) {
  return flatMapGenerator(
    delegatedToLots(reader, address),
    async function* (unresolvedLot) {
      const lot = resolveLot(unresolvedLot);

      if (lot.rules.permissions === 0) {
        return;
      }

      if (!(lot.rules.permissions & PERMISSION_VOTE)) {
        return;
      }

      if (
        !(await checkBlocksBeforeVoteCloses(lot.rules, proposal, latestBlock))
      ) {
        return;
      }

      yield lot;
    }
  );
}

export async function getLiquidDelegatatedVoteLotsForSigner(
  address: string,
  reader: Reader<typeof alligatorEntityDefinitions>
) {
  return flatMapGenerator(
    delegatedToLots(reader, address),
    async function* (unresolvedLot) {
      const lot = resolveLot(unresolvedLot);

      console.log({ lot });

      if (lot.rules.permissions === 0) {
        return;
      }

      if (!(lot.rules.permissions & PERMISSION_SIGN)) {
        return;
      }

      yield lot;
    }
  );
}
