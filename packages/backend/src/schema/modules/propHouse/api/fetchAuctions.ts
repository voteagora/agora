import { z } from "zod";

import { makeFetcher } from "../../../../shared/workers/datadogTracer/fetcher";

import { basePath } from "./common";

type FetchAuctionsArgs = {
  communityId: number;
};

export const auctionsAuction = z.object({
  id: z.number(),
  communityId: z.number(),

  title: z.string(),
  description: z.string(),
  fundingAmount: z.string(),
  currencyType: z.string(),
  balanceBlockTag: z.number(),
  visible: z.boolean(),

  createdDate: z.string(),

  startTime: z.string(),
  proposalEndTime: z.string(),
  votingEndTime: z.string(),

  numProposals: z.number(),
  numWinners: z.number(),
});

export const fetchAuctionsResponse = z.array(auctionsAuction);

export async function fetchAuctions(
  args: FetchAuctionsArgs,
  fetcher = makeFetcher()
) {
  const response = await fetcher.fetch(
    new Request(
      new URL(`auctions/forCommunity/${args.communityId}`, basePath).toString()
    )
  );
  const body = await response.json();
  return fetchAuctionsResponse.parse(body);
}
