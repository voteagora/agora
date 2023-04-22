import { mergeResolvers } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";

import * as commonResolvers from "./resolvers/common";
import * as delegateStatement from "./resolvers/delegateStatement";
import { Resolvers } from "./resolvers/generated/types";
import * as governanceResolvers from "./resolvers/governance";
import * as liquidDelegation from "./resolvers/liquidDelegation";
import * as propHouseResolvers from "./resolvers/propHouse";
import * as scalars from "./resolvers/scalars";
import schema from "./schema.graphql";
import { applyIdPrefix } from "./transformers/applyIdPrefix";
import { attachTracingContextInjection } from "./transformers/tracingContext";

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
