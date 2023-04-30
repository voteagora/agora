import { RuntimeType } from "../indexer/serde";
import {
  collectGenerator,
  limitGenerator,
  skipGenerator,
} from "../utils/generatorUtils";
import { IndexKeyType } from "../indexer/storage/keys/indexKey";
import { EntityDefinitions, Reader } from "../indexer/storage/reader/type";
import { safeParseNumber } from "../utils/safeParseNumber";

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
  IndexName extends keyof EntityDefinitionsType[EntityName]["indexes"] & string
>(
  reader: Reader<EntityDefinitionsType>,
  entityName: EntityName,
  indexName: IndexName,
  first: number,
  after: string | null,
  prefix?: IndexKeyType
): Promise<Connection<RuntimeType<EntityDefinitions[EntityName]["serde"]>>> {
  const edges = (
    await collectGenerator(
      limitGenerator(
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

export function paginateArray<T>(
  items: T[],
  first: number,
  after: string | null
): Connection<T> {
  const startingIndex = (() => {
    if (!after) {
      return 0;
    }

    const parsedNumber = safeParseNumber(after);
    if (parsedNumber === null) {
      throw new Error(`invalid cursor ${after}`);
    }

    return parsedNumber + 1;
  })();

  const edges = Array.from(items.entries())
    .slice(startingIndex, startingIndex + first)
    .map<Edge<T>>(([index, node]) => ({
      cursor: index.toString(),
      node,
    }));

  return {
    edges,
    pageInfo: {
      endCursor: edges[edges.length - 1]?.cursor ?? null,
      hasNextPage: items.length - startingIndex > first,
      hasPreviousPage: false,
      startCursor: null,
    },
  };
}
