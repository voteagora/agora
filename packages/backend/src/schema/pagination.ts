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
