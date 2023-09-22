import { Resolvers } from "./resolvers/generated/types";
import * as snapshotResolvers from "./resolvers/snapshot";
import * as scalars from "./resolvers/scalars";
import * as commonResolvers from "./resolvers/common";
import * as governanceResolvers from "./resolvers/governance";
import * as delegateStatement from "./resolvers/delegateStatement";
import * as retroPGFResolvers from "./resolvers/retroPGF";
import { attachTracingContextInjection } from "./transformers/tracingContext";
import { applyIdPrefix } from "./transformers/applyIdPrefix";
import { makeExecutableSchema } from "@graphql-tools/schema";

// @ts-ignore
import schema from "./schema.graphql";

// @ts-ignore
export const resolvers: Resolvers = {
  ...snapshotResolvers,
  ...governanceResolvers,
  ...scalars,
  ...commonResolvers,
  ...delegateStatement,
  ...retroPGFResolvers,
};

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
