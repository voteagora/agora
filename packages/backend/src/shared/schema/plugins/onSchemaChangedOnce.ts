import { Plugin } from "@graphql-yoga/common";

/**
 * A plugin mixin implementing onSchemaChangedOnce which will stop applying the
 * inner plugin after replaceSchema has been called.
 */
export function onSchemaChangedOnce<ContextType extends Record<string, any>>(
  nameSymbol: string,
  pluginInner: Required<Plugin<ContextType>>["onSchemaChange"]
): Plugin<ContextType> {
  return {
    onSchemaChange({ schema, replaceSchema }) {
      if ((schema.extensions as any)?.[nameSymbol]) {
        return;
      }

      pluginInner({
        schema,
        replaceSchema: (nextSchema) => {
          nextSchema.extensions = {
            ...nextSchema.extensions,
            [nameSymbol]: true,
          };
          replaceSchema(nextSchema);
        },
      });
    },
  };
}
