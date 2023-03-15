import { AvailableVotingPower } from "./usePropHouseAvailableVotingPower";
import { compareBy, flipComparator } from "../../utils/sorting";
import Heap from "heap";

export type VoteAssignment = {
  address: string;
  weight: number;
  proposalNumber: number;
};

/**
 * Assigns pending votes to addresses with available voting power, splitting
 * pending votes between available voting power slots if necessary. This
 * implementation does not provide an optimal solution (where optimal is
 * minimum splits) but should produce a good result in many cases.
 */
export function* assignPendingVotes(
  availableVotingPower: AvailableVotingPower[],
  pendingVotes: PendingVote[]
): Generator<VoteAssignment> {
  const pendingVotesHeap = (() => {
    const pendingVotesHeap = new Heap<PendingVote>(
      flipComparator(compareBy((it) => it.votes))
    );

    for (const pendingVote of pendingVotes) {
      pendingVotesHeap.push(pendingVote);
    }

    return pendingVotesHeap;
  })();

  const availableVotingPowerHeap = (() => {
    const availableVotingPowerHeap = new Heap<AvailableVotingPower>(
      flipComparator(compareBy((it) => it.availableVotingPower))
    );

    for (const availableVotingPowerItem of availableVotingPower) {
      availableVotingPowerHeap.push(availableVotingPowerItem);
    }

    return availableVotingPowerHeap;
  })();

  while (true) {
    const largestPendingVotes = pendingVotesHeap.pop();
    if (!largestPendingVotes) {
      break;
    }

    const largestAvailableVotingPowerSlot = availableVotingPowerHeap.pop();
    if (!largestAvailableVotingPowerSlot) {
      throw new Error("pending votes exceeds available voting power slots");
    }

    yield {
      proposalNumber: largestPendingVotes.proposalNumber,
      weight: Math.min(
        largestPendingVotes.votes,
        largestAvailableVotingPowerSlot.availableVotingPower
      ),
      address: largestAvailableVotingPowerSlot.address,
    };

    const availableVotingPower =
      largestAvailableVotingPowerSlot.availableVotingPower -
      largestPendingVotes.votes;

    if (availableVotingPower > 0) {
      availableVotingPowerHeap.push({
        ...largestAvailableVotingPowerSlot,
        availableVotingPower,
      });
    } else if (availableVotingPower < 0) {
      pendingVotesHeap.push({
        votes: availableVotingPower * -1,
        proposalNumber: largestPendingVotes.proposalNumber,
      });
    }
  }
}

export type PendingVote = {
  proposalNumber: number;
  votes: number;
};

export function flattenPendingVotes(pendingVotesRaw: Map<number, number>) {
  return Array.from(pendingVotesRaw.entries()).map(
    ([proposalNumber, votes]) => ({
      proposalNumber,
      votes,
    })
  );
}
