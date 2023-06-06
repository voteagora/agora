import { ethers } from "ethers";

import { createModule } from "../../../shared/schema/modules";
import { ReplaceContextAllResolvers } from "../../../shared/schema/helpers/replaceContextResolvers";
import { IVotesAddress } from "../../../shared/contracts/indexers/ERC721Votes/entities/address";
import { Reader } from "../../../shared/indexer/storage/reader/type";
import { alligatorEntityDefinitions } from "../../../shared/contracts/indexers/Alligator/entities/entities";

import { DelegateStatement } from "./resolvers/DelegateStatement";
import { Delegate } from "./resolvers/Delegate";
import { DelegateStatementModule } from "./generated-types/module-types";
import typeDefs from "./schema.graphql";
import { Mutation } from "./resolvers/Mutation";
import { StatementStorage } from "./context/statementStorage";
import { EmailStorage } from "./context/emailStorage";

type Dependencies = {
  statementStorage: StatementStorage;
  emailStorage: EmailStorage;
  provider: ethers.providers.BaseProvider;
  reader: Reader<
    {
      IVotesAddress: typeof IVotesAddress;
    } & typeof alligatorEntityDefinitions
  >;
};

type ResolversAssignable = ReplaceContextAllResolvers<
  DelegateStatementModule.Resolvers,
  Dependencies
>;

export type Resolvers = Required<ResolversAssignable>;

const resolvers: ResolversAssignable = {
  Mutation,
  Delegate,
  DelegateStatement,
};

export const delegateStatementModule = createModule<Dependencies>({
  id: "delegateStatement",
  resolvers,
  typeDefs,
});
