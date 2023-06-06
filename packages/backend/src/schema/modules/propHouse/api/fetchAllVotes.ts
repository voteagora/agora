import { z } from "zod";

import { makeFetcher } from "../../../../shared/workers/datadogTracer/fetcher";

import { basePath, signedData } from "./common";

export const vote = z.object({
  id: z.number(),
  proposalId: z.number(),
  auctionId: z.number(),
  address: z.string(),

  direction: z.number(),
  weight: z.number(),
  signedData,

  createdDate: z.string(),
});

const fetchAllVotesResponse = z.array(vote);

export async function fetchAllVotes(fetcher = makeFetcher()) {
  const response = await fetcher.fetch(
    new Request(new URL("votes", basePath).toString())
  );

  const body = await response.json();
  return fetchAllVotesResponse.parse(body);
}
