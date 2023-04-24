import { z } from "zod";

import { makeFetcher } from "../../../../shared/workers/datadogTracer/fetcher";

import { basePath, proposal } from "./common";
import { vote } from "./fetchAllVotes";

type FetchProposalsForAuctionArgs = {
  auctionId: string;
};

const proposalsResponse = z.array(
  proposal.extend({
    votes: z.array(vote),
  })
);

export async function fetchProposalsForAuction(
  args: FetchProposalsForAuctionArgs,
  fetcher = makeFetcher()
) {
  const response = await fetcher.fetch(
    new Request(
      new URL(`auctions/${args.auctionId}/proposals`, basePath).toString()
    )
  );
  const body = await response.json();
  return proposalsResponse.parse(body);
}
