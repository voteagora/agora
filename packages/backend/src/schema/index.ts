import { Resolvers } from "./resolvers/generated/types";
import * as scalars from "./resolvers/scalars";
import * as commonResolvers from "./resolvers/common";
import * as governanceResolvers from "./resolvers/governance";
import * as propHouseResolvers from "./resolvers/propHouse";
import * as delegateStatement from "./resolvers/delegateStatement";
import { attachTracingContextInjection } from "./transformers/tracingContext";
import { applyIdPrefix } from "./transformers/applyIdPrefix";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeResolvers } from "@graphql-tools/merge";

// @ts-ignore
import schema from "./schema.graphql";

export const resolvers: Resolvers = mergeResolvers([
  governanceResolvers,
  propHouseResolvers,
  scalars,
  commonResolvers,
  delegateStatement,
]);

export function makeGatewaySchema() {
  return attachTracingContextInjection(
    applyIdPrefix(
      makeExecutableSchema({
        typeDefs: schema,

        resolvers,
      })
    )
  );
}
