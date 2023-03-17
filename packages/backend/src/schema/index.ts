import { makeExecutableSchema } from "@graphql-tools/schema";

import { mergeResolvers } from "@graphql-tools/merge";

import { Resolvers } from "./resolvers/generated/types";

import * as scalars from "./resolvers/scalars";
import * as commonResolvers from "./resolvers/common";
import * as governanceResolvers from "./resolvers/governance";
import * as propHouseResolvers from "./resolvers/propHouse";
import * as delegateStatement from "./resolvers/delegateStatement";
import * as liquidDelegation from "./resolvers/liquidDelegation";

import { attachTracingContextInjection } from "./transformers/tracingContext";
import { applyIdPrefix } from "./transformers/applyIdPrefix";

// @ts-ignore
import schema from "./schema.graphql";

export const resolvers: Resolvers = mergeResolvers([
  governanceResolvers,
  propHouseResolvers,
  scalars,
  commonResolvers,
  delegateStatement,
  liquidDelegation,
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
