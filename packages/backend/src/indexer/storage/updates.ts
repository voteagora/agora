import { BlockIdentifier } from "../storageHandle";
import { EntityDefinitions } from "./reader";
import { makeEntityKey } from "../entityKey";
import { blockIdentifierKey } from "./entityStore";
import { makeIndexKey } from "../indexKey";

export type EntityWithChange = {
  entity: string;
  id: string;
  newValue: unknown;
  oldValue: unknown | undefined;
};

export type Operation =
  | {
      type: "PUT";
      key: string;
      value: unknown;
    }
  | {
      type: "DELETE";
      key: string;
    };

export type VersionedOperation = {
  operation: Operation;
  previousValue: unknown | null;
};

export function updatesForEntities(
  block: BlockIdentifier,
  previousBlockIdentifier: BlockIdentifier | null,
  changes: EntityWithChange[],
  entityDefinitions: EntityDefinitions
): VersionedOperation[] {
  return [
    ...changes.flatMap((change) => {
      const entityDefinition = entityDefinitions[change.entity];

      return [
        {
          operation: {
            type: "PUT" as const,
            key: makeEntityKey(change.entity, change.id),
            value: entityDefinition.serde.serialize(change.newValue),
          },
          previousValue: change.oldValue ?? null,
        },
        ...entityDefinition.indexes.flatMap((indexDefinition) => {
          return [
            ...(() => {
              if (!change.oldValue) {
                return [];
              }

              return [
                {
                  operation: {
                    type: "DELETE" as const,
                    key: makeIndexKey(indexDefinition, {
                      entity: change.entity,
                      id: change.id,
                      value: entityDefinition.serde.deserialize(
                        change.oldValue
                      ),
                    }),
                  },
                  previousValue: change.id,
                },
              ];
            })(),
            {
              operation: {
                type: "PUT" as const,
                key: makeIndexKey(indexDefinition, {
                  entity: change.entity,
                  id: change.id,
                  value: change.newValue,
                }),
                value: change.id,
              },

              // When inserting an index key, rollbacks should always delete
              // the value. An index key will never be updated, only created
              // and deleted. This is true because the value is part of the
              // indexKey.
              previousValue: null,
            },
          ];
        }),
      ];
    }),
    {
      operation: {
        type: "PUT",
        key: blockIdentifierKey,
        value: block,
      },
      previousValue: previousBlockIdentifier,
    },
  ];
}
