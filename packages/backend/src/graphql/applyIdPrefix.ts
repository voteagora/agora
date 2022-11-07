import { MapperKind, mapSchema } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLSchema } from "graphql";

export function applyIdPrefix(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName, typeName) => {
      if (fieldName !== "id") {
        return fieldConfig;
      }

      if (typeName === "Governance" && fieldName === "id") {
        return null;
      }

      return {
        ...fieldConfig,
        resolve: (...args) => {
          const resolvedValue = (fieldConfig.resolve ?? defaultFieldResolver)(
            ...args
          );

          return [typeName, resolvedValue].join("|");
        },
      };
    },
  });
}
