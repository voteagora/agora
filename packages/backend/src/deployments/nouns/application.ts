import { ethers } from "ethers";
import { Address } from "viem";

import { DependenciesFromModuleDefinitions } from "../../shared/schema/modules";
import { commonModule } from "../../schema/modules/common/module";
import { delegateModule } from "../../schema/modules/delegate/module";
import { delegateStatementModule } from "../../schema/modules/delegateStatement/module";
import { liquidDelegationModule } from "../../schema/modules/liquidDelegation/module";
import { propHouseModule } from "../../schema/modules/propHouse/module";
import { nounsModule } from "../../schema/modules/nouns/module";
import { Prettify } from "../../shared/utils/unionToIntersection";
import { LatestBlockFetcher } from "../../shared/schema/context/latestBlockFetcher";
import { ErrorReporter } from "../../shared/schema/helpers/nonFatalErrors";
import { loadAccount } from "../../shared/contracts/indexers/ERC721Votes/entities/address";
import { StatementStorage } from "../../schema/modules/delegateStatement/context/statementStorage";
import { EmailStorage } from "../../schema/modules/delegateStatement/context/emailStorage";

import { daoContract } from "./indexers/NounsDAO/NounsDAO";
import { makeNounsNameResolver } from "./nameResolver";
import { makeLiquidDelegationDelegatesLoader } from "./delegatesLoader";
import { fetchLatestQuorum, fetchQuorumForProposal } from "./quorumFetcher";

export const modules = <const>[
  commonModule,
  delegateModule,
  delegateStatementModule,
  liquidDelegationModule,
  propHouseModule,
  nounsModule,
];

export type Context = Prettify<
  DependenciesFromModuleDefinitions<typeof modules>
>;

type ContextArgs = {
  provider: ethers.providers.BaseProvider;
  latestBlockFetcher: LatestBlockFetcher;
  emailStorage: EmailStorage;
  errorReporter: ErrorReporter;
  statementStorage: StatementStorage;
};

export function makeContext(
  args: ContextArgs,
  reader: Context["reader"]
): Context {
  return {
    ...args,
    propHouse: {
      communityId: 1,
    },
    reader,
    nameResolver: makeNounsNameResolver(args.provider),
    liquidDelegation: {
      daoContract: daoContract.address as Address,
    },
    delegatesLoader: makeLiquidDelegationDelegatesLoader(reader),
    accountLoader: {
      async loadAccount(address: Address) {
        return await loadAccount(reader, address);
      },
    },
    quorumFetcher: {
      async fetchQuorum(proposalId) {
        if (proposalId) {
          return fetchQuorumForProposal(proposalId, args.provider);
        }

        return fetchLatestQuorum(
          args.provider,
          args.latestBlockFetcher,
          reader
        );
      },
    },
  };
}
