import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { useMemo } from "react";
import {
  useProposalsInnerFragment$data,
  useProposalsInnerFragment$key,
} from "./__generated__/useProposalsInnerFragment.graphql";

export function useProposals<
  Proposals extends useProposalsInnerFragment$data["proposals"][0]
>({ proposals }: { proposals: ReadonlyArray<Proposals> }) {
  const combinedProposals = useMemo(
    () => [
      ...proposals.map((proposal) => ({
        type: "ON_CHAIN" as const,
        proposal,
      })),
    ],
    [proposals]
  );
  return combinedProposals;
}
// eslint-disable-next-line
function useProposalsInnerFragmentHolder(
  fragmentRef: useProposalsInnerFragment$key
) {
  return useFragment(
    graphql`
      fragment useProposalsInnerFragment on Query {
        proposals {
          # eslint-disable-next-line relay/unused-fields
          id
        }
      }
    `,
    fragmentRef
  );
}
