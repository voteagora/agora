import { basePath, proposal } from "./common";
import { z } from "zod";
import { vote } from "./fetchAllVotes";

const fetchVotesResponseVote = vote.extend({
  proposal,
});

export const fetchVotesResponse = z.array(fetchVotesResponseVote);

type FetchVotesArgs = {
  voter: string;
};

export async function fetchVotes(args: FetchVotesArgs) {
  const response = await fetch(
    new URL(`votes/by/${args.voter}`, basePath).toString()
  );

  const body = await response.json();
  return fetchVotesResponse.parse(body);
}
