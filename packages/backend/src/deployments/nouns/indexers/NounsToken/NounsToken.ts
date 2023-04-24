import { nounsToken } from "@agora/common";

import { makeIndexerDefinition } from "../../../../shared/indexer";
import { intoContractInstance } from "../../../../shared/indexer/process/contractInstance";
import { makeERC721VotesIndexerDefinition } from "../../../../shared/contracts/indexers/ERC721Votes/ERC721Votes";
import { erc721EntityDefinitions } from "../../../../shared/contracts/indexers/ERC721Votes/entities";

import { Noun } from "./entities/noun";

const nounsTokenContract = intoContractInstance(nounsToken);

export const nounsTokenIndexer = (() => {
  const def = makeERC721VotesIndexerDefinition(
    nounsTokenContract,
    "NounsToken"
  );

  return makeIndexerDefinition(
    nounsTokenContract,
    { Noun, ...erc721EntityDefinitions },
    {
      name: def.name,

      eventHandlers: {
        ...def.eventHandlers,
        NounCreated: {
          async handle(
            handle,
            [tokenId, [background, body, accessory, head, glasses]]
          ) {
            handle.saveEntity("Noun", tokenId.toString(), {
              tokenId,
              background,
              body,
              accessory,
              glasses,
              head,
            });
          },
        },
      },
    }
  );
})();
