import { entityDefinitions } from "..";
import { makeEntityDefinition, StorageHandleForIndexer } from "../../process";
import * as serde from "../../serde";
import { RuntimeType } from "../../serde";
import { Reader } from "../../storage/reader";
import { EASIndexer } from "./../EAS";

export const serchEntityDefinitions = {
  ApplicationsSearchTrie: makeEntityDefinition({
    serde: serde.object({
      key: serde.string,
      ids: serde.array(serde.string),
    }),
    indexes: [],
  }),

  ListsSearchTrie: makeEntityDefinition({
    serde: serde.object({
      key: serde.string,
      ids: serde.array(serde.string),
    }),
    indexes: [],
  }),
};

function normalizeKey(key: string) {
  return key
    .toLowerCase()
    .replace(" ", "")
    .replace(/[^a-z0-9]/g, "");
}

export async function addToApplicationsTrie(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>,
  application: RuntimeType<
    typeof EASIndexer["entities"]["Application"]["serde"]
  >
) {
  // Add name words by character
  const nameWords = application.displayName.split(" ");
  await addWordsByCharToTrie(
    handle,
    "ApplicationsSearchTrie",
    nameWords,
    application.uid
  );

  // Add description words
  const descriptionWords = application.contributionDescription.split(" ");
  const words = [...new Set(descriptionWords)]
    .map((it) => normalizeKey(it))
    .filter((it) => it.length > 3); // remove short words
  await addFullWordsToTrie(
    handle,
    "ApplicationsSearchTrie",
    words,
    application.uid
  );
}

export async function addToListsTrie(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>,
  application: RuntimeType<typeof EASIndexer["entities"]["List"]["serde"]>
) {
  // Add name words by character
  const nameWords = application.listName.split(" ");
  await addWordsByCharToTrie(
    handle,
    "ListsSearchTrie",
    nameWords,
    application.uid
  );

  // Add description words
  const descriptionWords = application.listDescription.split(" ");
  const words = [...new Set(descriptionWords)]
    .map((it) => normalizeKey(it))
    .filter((it) => it.length > 3); // remove short words
  await addFullWordsToTrie(handle, "ListsSearchTrie", words, application.uid);
}

export async function searchByPrefix(
  reader: Reader<typeof entityDefinitions>,
  entityName: "Application" | "List",
  search: string
): Promise<string[]> {
  const words = search.split(" ");
  let result = [];
  for await (const word of words) {
    const key = normalizeKey(word);
    const trie = await reader.getEntity(`${entityName}sSearchTrie`, key);
    if (trie) {
      result.push(...trie.ids);
    }
  }

  console.log(result);

  return result;
}

async function addWordsByCharToTrie(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>,
  trieName: "ApplicationsSearchTrie" | "ListsSearchTrie",
  words: string[],
  entityId: string
) {
  for (const word of words) {
    const name = normalizeKey(word);
    let key = "";
    for (const char of name) {
      key += char;
      const trie = await handle.loadEntity(trieName, key);
      if (trie) {
        if (!trie.ids.includes(entityId)) {
          trie.ids.push(entityId);
          handle.saveEntity(trieName, key, trie);
        }
      } else {
        handle.saveEntity(trieName, key, {
          key,
          ids: [entityId],
        });
      }
    }
  }
}

async function addFullWordsToTrie(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>,
  trieName: "ApplicationsSearchTrie" | "ListsSearchTrie",
  words: string[],
  entityId: string
) {
  for (const word of words) {
    const key = normalizeKey(word);
    const trie = await handle.loadEntity(trieName, key);
    if (trie) {
      if (!trie.ids.includes(entityId)) {
        trie.ids.push(entityId);
        handle.saveEntity(trieName, key, trie);
      }
    } else {
      handle.saveEntity(trieName, key, {
        key,
        ids: [entityId],
      });
    }
  }
}
