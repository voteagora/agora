import { EntityDefinitions, Reader } from "../indexer/storage/reader";
import { RuntimeType } from "../indexer/serde";
import {
  collectGenerator,
  limitGenerator,
} from "../indexer/utils/generatorUtils";

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
  after: string | null
): Promise<Connection<RuntimeType<EntityDefinitions[EntityName]["serde"]>>> {
  const entityDefinition = reader.entityDefinitions[entityName];
  const indexDefinition = entityDefinition.indexes.find(
    (indexDefinition) => indexDefinition.indexName === indexName
  )!;

  const edges = (
    await collectGenerator(
      limitGenerator(
        reader.getEntitiesByIndex(entityName, indexName, {
          type: "RANGE",
          startingIndexKey: after ?? undefined,
        }),
        first + 1
      )
    )
  ).flatMap<Edge<RuntimeType<EntityDefinitions[EntityName]["serde"]>>>(
    (node, idx, array) => {
      if (idx === first) {
        return [];
      }

      return [
        {
          node,
          cursor: idx > 0 ? indexDefinition.indexKey(array[idx - 1]) : "",
        },
      ];
    }
  );

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
