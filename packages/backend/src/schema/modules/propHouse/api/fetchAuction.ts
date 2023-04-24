import { z } from "zod";

import { makeFetcher } from "../../../../shared/workers/datadogTracer/fetcher";

import { basePath, proposal } from "./common";

type FetchAuctionArgs = {
  auctionId: string;
};

export const auction = z.object({
  id: z.number(),
  community: z.number(),

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
});

const auctionResponse = auction.extend({
  proposals: z.array(proposal),
});

export async function fetchAuction(
  args: FetchAuctionArgs,
  fetcher = makeFetcher()
) {
  const response = await fetcher.fetch(
    new Request(new URL(`auctions/${args.auctionId}`, basePath).toString())
  );
  const body = await response.json();
  return auctionResponse.parse(body);
}
