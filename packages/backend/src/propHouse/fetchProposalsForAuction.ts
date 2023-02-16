import { basePath, proposal } from "./common";
import { z } from "zod";
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
  args: FetchProposalsForAuctionArgs
) {
  const response = await fetch(
    new URL(`auctions/${args.auctionId}/proposals`, basePath).toString()
  );
  const body = await response.json();
  return proposalsResponse.parse(body);
}
