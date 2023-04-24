import { z } from "zod";

import { makeFetcher } from "../../../../shared/workers/datadogTracer/fetcher";

import { basePath, proposal } from "./common";
import { vote } from "./fetchAllVotes";

const fetchVotesResponseVote = vote.extend({
  proposal,
});

export const fetchVotesResponse = z.array(fetchVotesResponseVote);

type FetchVotesArgs = {
  voter: string;
};

export async function fetchVotes(
  args: FetchVotesArgs,
  fetcher = makeFetcher()
) {
  const response = await fetcher.fetch(
    new Request(new URL(`votes/by/${args.voter}`, basePath).toString())
  );

  const body = await response.json();
  return fetchVotesResponse.parse(body);
}
