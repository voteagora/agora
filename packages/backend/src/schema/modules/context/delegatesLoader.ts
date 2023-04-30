import {
  Connection,
  driveReaderByIndex,
} from "../../../shared/schema/pagination";
import { Reader } from "../../../shared/indexer/storage/reader/type";
import { IVotesAddress } from "../../../shared/contracts/indexers/ERC20Votes/entities/address";

export type DelegatesLoaderOrderBy = "mostDelegates" | "mostVotingPower";

export type DelegatesLoader = {
  loadDelegates(args: {
    orderBy: DelegatesLoaderOrderBy;
    first: number;
    after: string | null;
  }): Promise<Connection<{ address: string }>>;
};

export function makeSimpleDelegatesLoader(
  reader: Reader<{ IVotesAddress: typeof IVotesAddress }>
): DelegatesLoader {
  return {
    async loadDelegates({ orderBy, first, after }) {
      return await driveReaderByIndex(
        reader,
        "IVotesAddress",
        (() => {
          switch (orderBy) {
            case "mostDelegates":
              return "byTokenHoldersRepresented";

            case "mostVotingPower":
              return "byTokensRepresented";
          }
        })(),
        first,
        after ?? null
      );
    },
  };
}
