import { groupBy } from "lodash";
import { z } from "zod";

const basePath = "https://prod.backend.prop.house/";

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

type FetchAuctionsArgs = {
  communityId: number;
};

const auction = z.object({
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

export const fetchAuctionsResponse = z.array(auction);

export async function fetchAuctions(args: FetchAuctionsArgs) {
  const response = await fetch(
    new URL(`auctions/forCommunity/${args.communityId}`, basePath).toString()
  );
  const body = await response.json();
  return fetchAuctionsResponse.parse(body);
}

type FetchVotesArgs = {
  voter: string;
};

const signedData = z.union([
  z.object({
    message: z.string(),
    signature: z.string(),
    signer: z.string(),
  }),
  z.object({
    no_data: z.string(),
  }),
  z.object({
    mulstig: z.string(),
  }),
]);

const proposal = z.object({
  id: z.number(),
  auctionId: z.number(),
  address: z.string(),

  title: z.string(),
  tldr: z.string(),
  what: z.string(),
  signedData,

  createdDate: z.string(),
  lastUpdatedDate: z.string().or(z.null()),
  visible: z.boolean(),
  voteCount: z.string(),
});

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

const fetchVotesResponseVote = vote.extend({
  proposal,
});

const fetchVotesResponse = z.array(fetchVotesResponseVote);

export async function fetchVotes(args: FetchVotesArgs) {
  const response = await fetch(
    new URL(`votes/by/${args.voter}`, basePath).toString()
  );

  const body = await response.json();
  return fetchVotesResponse.parse(body);
}

const fetchAllVotesResponse = z.array(vote);

export async function fetchAllVotes() {
  const response = await fetch(new URL("votes", basePath).toString());

  const body = await response.json();
  return fetchAllVotesResponse.parse(body);
}

export function groupVotesByAuction(
  votes: z.infer<typeof fetchVotesResponse>,
  auctions: z.infer<typeof fetchAuctionsResponse>
): {
  auction: z.infer<typeof auction>;
  createdAt: string;
  votes: { proposal: z.infer<typeof proposal>; weight: number }[];
}[] {
  return Object.entries(
    groupBy(
      votes.filter((vote) => vote.proposal.visible),
      (it) => it.auctionId.toString()
    )
  ).flatMap(([auctionId, votes]) => {
    const auction = auctions.find(
      (auction) => auction.id.toString() === auctionId
    );

    if (!auction) {
      return [];
    }

    if (!auction.visible) {
      return [];
    }

    const createdAt = votes
      .slice(1)
      .reduce(
        (acc, vote) => Math.max(new Date(vote.createdDate).valueOf(), acc),
        new Date(votes[0].createdDate).valueOf()
      );

    return [
      {
        auction,
        createdAt: createdAt.toString(),

        votes: Object.entries(
          groupBy(votes, (it) => it.proposalId.toString())
        ).map(([, votes]) => {
          return {
            proposal: votes[0].proposal,
            weight: votes.reduce((acc, vote) => acc + vote.weight, 0),
          };
        }),
      },
    ];
  });
}
