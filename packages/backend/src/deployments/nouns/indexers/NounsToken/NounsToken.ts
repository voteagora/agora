import { nounsToken, nounsTokenSepolia } from "@agora/common";

import { Env } from "../../../../shared/types";
import { makeIndexerDefinition } from "../../../../shared/indexer";
import { intoContractInstance } from "../../../../shared/indexer/process/contractInstance";
import { makeERC721VotesIndexerDefinition } from "../../../../shared/contracts/indexers/ERC721Votes/ERC721Votes";
import { erc721EntityDefinitions } from "../../../../shared/contracts/indexers/ERC721Votes/entities";

import { Noun } from "./entities/noun";

const nounsTokenContract = intoContractInstance(nounsToken);
const nounsTokenContractSepolia = intoContractInstance(nounsTokenSepolia);

const makeNounsTokenIndexer = (env: Env) => {
  const def = makeERC721VotesIndexerDefinition(
    env === "prod" ? nounsTokenContract : nounsTokenContractSepolia,
    "NounsToken"
  );

  return makeIndexerDefinition(
    env === "prod" ? nounsTokenContract : nounsTokenContractSepolia,
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
};

export const nounsTokenIndexer = makeNounsTokenIndexer("prod");
export const nounsTokenIndexerSepolia = makeNounsTokenIndexer("dev");
