import { z } from "zod";
import { basePath, signedData } from "./common";

export const vote = z.object({
  id: z.number(),
  proposalId: z.number(),
  auctionId: z.number(),
  address: z.string(),

  direction: z.literal(1),
  weight: z.number(),
  signedData,

  createdDate: z.string(),
});

const fetchAllVotesResponse = z.array(vote);

export async function fetchAllVotes() {
  const response = await fetch(new URL("votes", basePath).toString());

  const body = await response.json();
  return fetchAllVotesResponse.parse(body);
}
