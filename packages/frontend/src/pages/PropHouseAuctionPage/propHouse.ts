import { useQuery } from "@tanstack/react-query";

export const basePath = "https://prod.backend.prop.house/";

type FetchVotingPowerForAddressArgs = {
  address: string;
  auctionId: string;
  communityAddress: string;
};

async function fetchVotingPowerForAddress({
  address,
  auctionId,
  communityAddress,
}: FetchVotingPowerForAddressArgs) {
  const response = await fetch(
    new URL(
      `communities/votesForAuction/${communityAddress}/${auctionId}/${address}`,
      basePath
    ).toString()
  );
  const body = await response.text();
  return parseInt(body);
}

export function useTotalVotingPower(args: {
  auctionId: string;
  communityAddress: string;
  address?: string;
}) {
  return useQuery({
    queryKey: [
      "useTotalVotingPower",
      args.address,
      args.auctionId,
      args.communityAddress,
    ],
    async queryFn() {
      if (!args.address) {
        return 0;
      }

      return await fetchVotingPowerForAddress({
        ...args,
        address: args.address,
      });
    },
    suspense: true,
    useErrorBoundary: true,
  }).data!;
}
