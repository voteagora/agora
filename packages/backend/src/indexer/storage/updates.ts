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

export function updatesForEntities(
  block: BlockIdentifier,
  changes: EntityWithChange[],
  entityDefinitions: EntityDefinitions
): Operation[] {
  return [
    ...changes.flatMap((change) => {
      const entityDefinition = entityDefinitions[change.entity];

      return [
        {
          type: "PUT" as const,
          key: makeEntityKey(change.entity, change.id),
          value: entityDefinition.serde.serialize(change.newValue),
        },
        ...entityDefinition.indexes.flatMap((indexDefinition) => {
          return [
            ...(() => {
              if (!change.oldValue) {
                return [];
              }

              return [
                {
                  type: "DELETE" as const,
                  key: makeIndexKey(indexDefinition, {
                    entity: change.entity,
                    id: change.id,
                    value: entityDefinition.serde.deserialize(change.oldValue),
                  }),
                },
              ];
            })(),
            {
              type: "PUT" as const,
              key: makeIndexKey(indexDefinition, {
                entity: change.entity,
                id: change.id,
                value: change.newValue,
              }),
              value: change.id,
            },
          ];
        }),
      ];
    }),
    {
      type: "PUT",
      key: blockIdentifierKey,
      value: block,
    },
  ];
}
