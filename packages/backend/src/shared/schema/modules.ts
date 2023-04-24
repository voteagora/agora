import { DocumentNode, GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeResolvers } from "@graphql-tools/merge";

import { UnionToIntersection } from "../utils/unionToIntersection";

export type ModuleDefinition<Dependencies extends Record<string, any>> = {
  id: string;
  resolvers: Record<string, any>;
  typeDefs: DocumentNode;
};

export function createModule<Dependencies extends Record<string, any> = {}>(
  definition: ModuleDefinition<Dependencies>
): ModuleDefinition<Dependencies> {
  return definition;
}

type DependenciesFromModuleDefinition<
  ModuleDefinitionType extends ModuleDefinition<Record<string, any>>
> = ModuleDefinitionType extends ModuleDefinition<infer Dependencies>
  ? Dependencies
  : never;

export type DependenciesFromModuleDefinitions<
  ModuleDefinitions extends ReadonlyArray<ModuleDefinition<Record<string, any>>>
> = UnionToIntersection<
  DependenciesFromModuleDefinition<ModuleDefinitions[number]>
>;

export function combineModules(
  definitions: readonly ModuleDefinition<Record<string, any>>[]
): GraphQLSchema {
  return makeExecutableSchema({
    typeDefs: definitions.map((it) => it.typeDefs),
    resolvers: mergeResolvers(definitions.map((it) => it.resolvers)),
  });
}
