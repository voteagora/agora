import { z } from "zod";

import { makeFetcher } from "../../../../shared/workers/datadogTracer/fetcher";

import { basePath, COMMUNITY_ADDRESS } from "./common";

export const fetchVotesResponse = z.number();

type FetchVotesArgs = {
  auctionId: string;
  voter: string;
};

export async function fetchVotingPowerForAuction(
  args: FetchVotesArgs,
  fetcher = makeFetcher()
) {
  const response = await fetcher.fetch(
    new Request(
      new URL(
        `communities/votesForAuction/${COMMUNITY_ADDRESS}/${args.auctionId}/${args.voter}`,
        basePath
      ).toString()
    )
  );

  const body = await response.json();
  return fetchVotesResponse.parse(body);
}
