import { TypedDataSigner } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";
import { groupBy } from "lodash";

import { assignPendingVotes, flattenPendingVotes } from "./assignPendingVotes";
import { submitVote } from "./propHouse";
import {
  signLiquidDelegatedVotes,
  signTokenDelegationVotes,
} from "./signVotes";
import {
  AvailableVotingPower,
  VotingAddress,
} from "./usePropHouseAvailableVotingPower";

export async function submitVotes(
  pendingVotesRaw: Map<number, number>,
  availableVotingPower: AvailableVotingPower[],
  votingAddresses: VotingAddress[],
  provider: ethers.providers.Provider,
  typedSigner: ethers.Signer & TypedDataSigner
) {
  const assignments = Array.from(
    assignPendingVotes(
      availableVotingPower,
      flattenPendingVotes(pendingVotesRaw)
    )
  );

  const assignmentsWithVotingAddresses = Object.entries(
    groupBy(assignments, (it) => it.address)
  ).map(([address, assignments]) => {
    const votingAddress = votingAddresses.find((it) => it.address === address);
    if (!votingAddress) {
      throw new Error("votingAddress not found");
    }

    return {
      votingAddress,
      assignments,
    };
  });

  const blockNumber = await provider.getBlockNumber();

  for (const assignment of assignmentsWithVotingAddresses) {
    const payloadGenerator = (() => {
      switch (assignment.votingAddress.type) {
        case "DELEGATED_TOKENS": {
          return signTokenDelegationVotes(
            {
              votes: assignment.assignments,
              address: assignment.votingAddress.address,
            },
            blockNumber,
            typedSigner
          );
        }

        case "LIQUID_DELEGATED_TOKENS": {
          return signLiquidDelegatedVotes(
            {
              votes: assignment.assignments,
              address: assignment.votingAddress.address,
            },
            blockNumber,
            assignment.votingAddress.lots[0].authorityChain.slice(),
            provider
          );
        }
      }
    })();

    for await (const payload of payloadGenerator) {
      await submitVote(payload);
    }
  }
}
