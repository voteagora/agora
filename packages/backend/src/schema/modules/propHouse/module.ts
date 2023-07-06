import { createModule } from "../../../shared/schema/modules";
import { ErrorReporter } from "../../../shared/schema/helpers/nonFatalErrors";
import { ReplaceContextAllResolvers } from "../../../shared/schema/helpers/replaceContextResolvers";

import typeDefs from "./schema.graphql";
import { PropHouseModule } from "./generated-types/module-types";
import { PropHouseAuction } from "./resolvers/PropHouseAuction";
import { PropHouseProposal } from "./resolvers/PropHouseProposal";
import { Query } from "./resolvers/Query";
import { Delegate } from "./resolvers/Delegate";

export type Resolvers = Required<ResolversAssignable>;

export type PropHouseArgs = {
  communityId: number;
};

type Dependencies = {
  propHouse: PropHouseArgs;
  errorReporter: ErrorReporter;
};

type ResolversAssignable = ReplaceContextAllResolvers<
  PropHouseModule.Resolvers,
  Dependencies
>;

const resolvers: ResolversAssignable = {
  PropHouseAuction,
  PropHouseProposal,
  Query,
  Delegate,
};

export const propHouseModule = createModule<Dependencies>({
  id: "propHouseModule",
  resolvers,
  typeDefs,
});
