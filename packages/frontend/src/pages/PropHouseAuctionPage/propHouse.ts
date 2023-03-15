import { useQuery } from "@tanstack/react-query";
import { ethers, BigNumber } from "ethers";

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
  return BigNumber.from(body).toNumber();
}

export async function submitVote(signedPayload: any) {
  const response = await fetch(new URL(`votes`, basePath).toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(signedPayload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function useTotalVotingPower(args: {
  auctionId: string;
  communityAddress: string;
  addresses: string[];
}) {
  return useQuery({
    queryKey: [
      "useTotalVotingPower",
      args.addresses,
      args.auctionId,
      args.communityAddress,
    ],
    async queryFn() {
      return Promise.all(
        args.addresses.map(async (address) => ({
          address: ethers.utils.getAddress(address),
          votingPower: await fetchVotingPowerForAddress({ ...args, address }),
        }))
      );
    },
    suspense: true,
    useErrorBoundary: true,
  }).data!;
}
