import { entityDefinitions } from "..";
import OrderedSet from "../../../utils/orderedSet";
import { makeEntityDefinition, StorageHandleForIndexer } from "../../process";
import * as serde from "../../serde";
import { RuntimeType } from "../../serde";
import { Reader } from "../../storage/reader";
import { EASIndexer } from "./../EAS";

const trieEntity = serde.object({
  key: serde.string,
  ids: serde.array(serde.string),
});

export const serchEntityDefinitions = {
  ApplicationsFirstNameTrie: makeEntityDefinition({
    serde: trieEntity,
    indexes: [],
  }),

  ApplicationsRemainingNameTrie: makeEntityDefinition({
    serde: trieEntity,
    indexes: [],
  }),

  ApplicationsBioTrie: makeEntityDefinition({
    serde: trieEntity,
    indexes: [],
  }),

  ApplicationsDescriptionTrie: makeEntityDefinition({
    serde: trieEntity,
    indexes: [],
  }),

  ListsSearchTrie: makeEntityDefinition({
    serde: trieEntity,
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
  const firstName = nameWords.shift();
  if (firstName) {
    await addWordsByCharToTrie(
      handle,
      "ApplicationsFirstNameTrie",
      [firstName],
      application.uid
    );
  }
  await addWordsByCharToTrie(
    handle,
    "ApplicationsRemainingNameTrie",
    nameWords,
    application.uid
  );

  // Add bio words
  const bioWords = [...new Set(application.bio.split(" "))]
    .map((it) => normalizeKey(it))
    .filter((it) => it.length > 3);
  await addFullWordsToTrie(
    handle,
    "ApplicationsBioTrie",
    bioWords,
    application.uid
  );

  // Add description words
  const descriptionWords = application.contributionDescription.split(" ");
  const impactDescriptionWords = application.impactDescription.split(" ");
  const words = [...new Set([...descriptionWords, ...impactDescriptionWords])]
    .map((it) => normalizeKey(it))
    .filter((it) => it.length > 3); // remove short words
  await addFullWordsToTrie(
    handle,
    "ApplicationsDescriptionTrie",
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

async function addWordsByCharToTrie(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>,
  trieName:
    | "ApplicationsFirstNameTrie"
    | "ApplicationsRemainingNameTrie"
    | "ListsSearchTrie",
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
  trieName:
    | "ApplicationsDescriptionTrie"
    | "ApplicationsBioTrie"
    | "ListsSearchTrie",
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

export async function searchApplicationsByPrefix(
  reader: Reader<typeof entityDefinitions>,
  search: string
): Promise<string[]> {
  const result = new OrderedSet<string>();

  const words = search.split(" ").filter((it) => it.length > 0);
  const wordsCount = words.length;
  if (wordsCount > 1) {
    // Search first + remaining name trie
    {
      const resultsForBoth = [];
      // Search by first name
      const firstNameSet = new Set<string>();
      const firstName = words[0];
      if (firstName) {
        (
          await searchTrieByPrefix(
            reader,
            "ApplicationsFirstNameTrie",
            normalizeKey(firstName)
          )
        ).forEach((it) => firstNameSet.add(it));
        resultsForBoth.push(firstNameSet);
      }

      // Search by remaining name
      const remainingNameSet = new Set<string>();
      const remainingName = words.slice(1).join(" ");
      (
        await searchTrieByPrefix(
          reader,
          "ApplicationsRemainingNameTrie",
          remainingName
        )
      ).forEach((it) => remainingNameSet.add(it));
      resultsForBoth.push(remainingNameSet);

      let intersectionSet = resultsForBoth[0];

      for (const resultSet of resultsForBoth) {
        intersectionSet = new Set(
          [...intersectionSet].filter((id) => resultSet.has(id))
        );
      }

      Array.from(intersectionSet).forEach((it) => result.add(it));
    }

    // Search remaining name trie for full search
    {
      (
        await searchTrieByPrefix(
          reader,
          "ApplicationsRemainingNameTrie",
          search
        )
      ).forEach((it) => result.add(it));
    }
  } else {
    // Search first name trie
    (
      await searchTrieByPrefix(reader, "ApplicationsFirstNameTrie", search)
    ).forEach((it) => result.add(it));

    // Search remaining name trie
    (
      await searchTrieByPrefix(reader, "ApplicationsRemainingNameTrie", search)
    ).forEach((it) => result.add(it));
  }

  // Search bio
  (await searchTrieByPrefix(reader, "ApplicationsBioTrie", search)).forEach(
    (it) => result.add(it)
  );

  // Search description
  (
    await searchTrieByPrefix(reader, "ApplicationsDescriptionTrie", search)
  ).forEach((it) => result.add(it));

  return result.values();
}

export async function searchTrieByPrefix(
  reader: Reader<typeof entityDefinitions>,
  trieName: keyof typeof serchEntityDefinitions,
  search: string
): Promise<string[]> {
  const words = search.split(" ").filter((it) => it.length > 0);
  const resultsForAllWords = [];

  for await (const word of words) {
    const key = normalizeKey(word);
    const trie = await reader.getEntity(trieName, key);
    resultsForAllWords.push(new Set(trie?.ids ?? []));
  }

  if (resultsForAllWords.length === 0) {
    return [];
  }

  let intersectionSet = resultsForAllWords[0];

  for (const resultSet of resultsForAllWords) {
    intersectionSet = new Set(
      [...intersectionSet].filter((id) => resultSet.has(id))
    );
  }

  return Array.from(intersectionSet);
}
