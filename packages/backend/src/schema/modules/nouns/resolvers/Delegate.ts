import { collectGenerator } from "../../../../shared/utils/generatorUtils";
import { exactIndexValue } from "../../../../shared/indexer/storage/indexQueryArgs";
import { Resolvers } from "../module";

export const Delegate: Resolvers["Delegate"] = {
  async nounsOwned({ address }, _args, { reader, accountLoader }) {
    const { tokensOwnedIds } = await accountLoader.loadAccount(address);

    return await collectGenerator(
      (async function* () {
        for (const tokenId of tokensOwnedIds.map((it) => it.toString())) {
          const noun = await reader.getEntity("Noun", tokenId.toString());
          if (!noun) {
            continue;
          }

          yield noun;
        }
      })()
    );
  },

  async nounsRepresented({ address }, _args, { reader, accountLoader }) {
    const tokenIdsGenerator = (async function* () {
      for await (const addressEntity of reader.getEntitiesByIndex(
        "IVotesAddress",
        "byDelegatingTo",
        exactIndexValue(address)
      )) {
        for (const tokenId of addressEntity.value.tokensOwnedIds) {
          yield tokenId;
        }
      }
    })();

    return await collectGenerator(
      (async function* () {
        for await (const tokenId of tokenIdsGenerator) {
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
