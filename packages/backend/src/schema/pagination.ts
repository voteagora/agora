import {
  EntityDefinitions,
  IndexedValue,
  Reader,
} from "../indexer/storage/reader";
import { RuntimeType } from "../indexer/serde";
import {
  collectGenerator,
  filterGenerator,
  limitGenerator,
  skipGenerator,
} from "../indexer/utils/generatorUtils";
import { IndexKeyType } from "../indexer/indexKey";
import seedrandom from "seedrandom";

export type PageInfo = {
  hasPreviousPage: boolean;
  startCursor: string | null;
  hasNextPage: boolean;
  endCursor: string | null;
};

export type Connection<T> = {
  edges: Edge<T>[];
  pageInfo: PageInfo;
};

export type Edge<T> = {
  node: T;
  cursor: string;
};

export async function driveReaderByIndex<
  EntityDefinitionsType extends EntityDefinitions,
  EntityName extends keyof EntityDefinitionsType & string,
  IndexName extends EntityDefinitions[EntityName]["indexes"][number]["indexName"]
>(
  reader: Reader<EntityDefinitionsType>,
  entityName: EntityName,
  indexName: IndexName,
  first: number,
  after: string | null,
  prefix?: IndexKeyType,
  filterFn?: (
    item: IndexedValue<
      Readonly<RuntimeType<EntityDefinitions[EntityName]["serde"]>>
    >
  ) => Promise<boolean> | boolean
): Promise<Connection<RuntimeType<EntityDefinitions[EntityName]["serde"]>>> {
  const edges = (
    await collectGenerator(
      limitGenerator(
        filterGenerator(
          skipGenerator(
            reader.getEntitiesByIndex(entityName, indexName, {
              prefix,

              starting: (() => {
                if (after) {
                  const [indexKey, entityId] = after.split("|");

                  return {
                    indexKey,
                    entityId,
                  };
                }

                if (prefix) {
                  return {
                    indexKey: prefix.indexKey,
                  };
                }

                return undefined;
              })(),
            }),
            after ? 1 : 0
          ),
          filterFn || (() => true)
        ),
        first
      )
    )
  ).map<Edge<RuntimeType<EntityDefinitions[EntityName]["serde"]>>>((node) => ({
    node: node.value,
    cursor: [node.indexKey, node.entityId].join("|"),
  }));

  const endCursor = edges[edges.length - 1]?.cursor;
  return {
    edges,
    pageInfo: {
      endCursor,
      hasNextPage: !!endCursor,
      hasPreviousPage: false,
      startCursor: null,
    },
  };
}

function parseStartingIndexFromAfter(after: string | null) {
  if (!after) {
    return 0;
  }

  const parsedNumber = safeParseNumber(after);
  if (parsedNumber === null) {
    throw new Error(`invalid cursor ${after}`);
  }

  return parsedNumber + 1;
}

function safeParseNumber(value: string): number | null {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * Paginate an async generator. This is not the most efficient way to create a
 * connection as it scans the entire generator, generating values from the
 * beginning to after + first, but it is more flexible.
 *
 * Prefer to use {@see driveReaderByIndex} or something which uses an index to
 * remove the scan to find the first item to emit.
 */
export async function paginateGenerator<T>(
  generator: AsyncGenerator<IndexedValue<T>>,
  first: number,
  after: string | null
): Promise<Connection<T>> {
  const startingIndex = parseStartingIndexFromAfter(after);

  const items = await collectGenerator(
    limitGenerator(skipGenerator(generator, startingIndex), first + 1)
  );

  const edges = items.slice(0, first).map((node, index) => ({
    cursor: (startingIndex + index).toString(),
    node: node.value,
  }));

  return {
    edges,
    pageInfo: {
      endCursor: edges[edges.length - 1]?.cursor,
      hasNextPage: !!items[first],
      hasPreviousPage: false,
      startCursor: null,
    },
  };
}

export async function driveRandomReaderByIndex<
  EntityDefinitionsType extends EntityDefinitions,
  EntityName extends keyof EntityDefinitionsType & string,
  IndexName extends EntityDefinitions[EntityName]["indexes"][number]["indexName"]
>(
  reader: Reader<EntityDefinitionsType>,
  entityName: EntityName,
  indexName: IndexName,
  first: number,
  after: string | null,
  seed: string,
  prefix?: IndexKeyType,
  filterFn?: (
    item: IndexedValue<
      Readonly<RuntimeType<EntityDefinitions[EntityName]["serde"]>>
    >
  ) => Promise<boolean> | boolean
): Promise<Connection<RuntimeType<EntityDefinitions[EntityName]["serde"]>>> {
  const edges = (
    await collectGenerator(
      limitGenerator(
        filterGenerator(
          skipGenerator(
            reader.getEntitiesByIndex(entityName, indexName, {
              prefix,

              starting: (() => {
                if (after) {
                  const [indexKey, entityId] = after.split("|");

                  return {
                    indexKey,
                    entityId,
                  };
                }

                if (prefix) {
                  return {
                    indexKey: prefix.indexKey,
                  };
                }

                return undefined;
              })(),
            }),
            after ? 1 : 0
          ),
          filterFn || (() => true)
        ),
        first
      )
    )
  ).map<Edge<RuntimeType<EntityDefinitions[EntityName]["serde"]>>>((node) => ({
    node: node.value,
    cursor: [node.indexKey, node.entityId].join("|"),
  }));

  const endCursor = edges[edges.length - 1]?.cursor;

  return {
    edges: shuffleArray(edges, seed),
    pageInfo: {
      endCursor,
      hasNextPage: !!endCursor,
      hasPreviousPage: false,
      startCursor: null,
    },
  };
}

function shuffleArray<T>(array: T[], seed: string): T[] {
  const rng = seedrandom(seed);
  const result = array.slice();
  let m = result.length;

  while (m) {
    let i = Math.floor(rng() * m--);

    let t = result[m];
    result[m] = result[i];
    result[i] = t;
  }

  return result;
}
