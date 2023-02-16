import { z } from "zod";
import { basePath } from "./common";

type FetchCommunityArgs = {
  name: string;
};

const community = z.object({
  id: z.number(),
  name: z.string(),
  contractAddress: z.string(),

  createdDate: z.string(),
  description: z.string(),
  ethFunded: z.string(),
  numAuctions: z.string(),
  numProposals: z.string(),
  profileImageUrl: z.string(),

  visible: z.boolean(),
});

const fetchCommunityResponse = community;

export async function fetchCommunity(args: FetchCommunityArgs) {
  const response = await fetch(
    new URL(`communities/name/${args.name}`, basePath).toString()
  );
  const body = await response.json();
  return fetchCommunityResponse.parse(body);
}
