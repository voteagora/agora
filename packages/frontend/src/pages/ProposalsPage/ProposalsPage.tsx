import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { ProposalsPageDetailQuery } from "./__generated__/ProposalsPageDetailQuery.graphql";
import { useTransition } from "react";
import { motion } from "framer-motion";
import {
  useNavigate,
  useParams,
} from "../../components/HammockRouter/HammockRouter";
import { useAccount } from "wagmi";
import ProposalsPageStandard from "./ProposalsPageStandard";
import ProposalsPageApproval from "./ApprovalProposal/ProposalsPageApproval";

export default function ProposalsPage() {
  const { proposalId } = useParams();
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();
  const { address } = useAccount();
  let setSelectedProposalID = (newProposalID: string) => {
    startTransition(() => {
      navigate({ path: `/proposals/${newProposalID}` });
    });
  };

  // TODO: refer to https://github.com/0xcaff/nouns-agora/blob/deployment/uniswap/packages/frontend/src/components/ActivityFeed/ActivityRow.tsx#L76

  const result = useLazyLoadQuery<ProposalsPageDetailQuery>(
    graphql`
      query ProposalsPageDetailQuery(
        $proposalId: ID!
        $address: String!
        $skipAddress: Boolean!
      ) {
        firstProposal: proposal(id: $proposalId) {
          proposalData {
            __typename
            ... on StandardProposalData {
              ...ProposalsPageStandardDataFragment
            }
            ... on ApprovalVotingProposalData {
              ...ProposalsPageApprovalDataFragment
            }
          }
          # eslint-disable-next-line relay/unused-fields
          number
          # eslint-disable-next-line relay/must-colocate-fragment-spreads
          ...VotesCastPanelPropSummaryFragment
          # eslint-disable-next-line relay/must-colocate-fragment-spreads
          ...ProposalDetailPanelFragment
          # eslint-disable-next-line relay/must-colocate-fragment-spreads
          ...ProposalVotesSummaryVoteTimeFragment
          # eslint-disable-next-line relay/must-colocate-fragment-spreads
          ...CastVoteInputVoteButtonsFragment
          # eslint-disable-next-line relay/must-colocate-fragment-spreads
          ...ApprovalProposalCriteriaQuorumVotesFragment
          # eslint-disable-next-line relay/must-colocate-fragment-spreads
          ...ApprovalCastVoteButtonFragment
          # eslint-disable-next-line relay/must-colocate-fragment-spreads
          ...OptionsResultsPanelStatusFragment
        }
        # eslint-disable-next-line relay/must-colocate-fragment-spreads
        ...ProposalsListPanelFragment
        # eslint-disable-next-line relay/must-colocate-fragment-spreads
        ...VotesCastPanelQueryFragment
          @arguments(
            address: $address
            skipAddress: $skipAddress
            proposalId: $proposalId
          )
        # eslint-disable-next-line relay/must-colocate-fragment-spreads
        ...VotesListPanelQueryFragment
          @arguments(
            #  address: $address
            #  skipAddress: $skipAddress
            proposalId: $proposalId
          )
        # eslint-disable-next-line relay/must-colocate-fragment-spreads
        ...ApprovalCastVoteButtonDelegateFragment
          @arguments(address: $address, skipAddress: $skipAddress)
      }
    `,
    {
      proposalId,
      address: address ?? "",
      skipAddress: !address,
    }
  );

  const selectedProposal = result.firstProposal;
  // This happens if user enters an invalid proposal
  // TODO: Show a 404 page instead
  if (!selectedProposal) {
    startTransition(() => {
      navigate({ path: "/proposals" });
    });
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isPending ? 0.3 : 1 }}
      transition={{ duration: 0.3, delay: isPending ? 0.3 : 0 }}
    >
      {(() => {
        switch (selectedProposal?.proposalData.__typename) {
          // TODO - change the condition once data is available
          case "ApprovalVotingProposalData": {
            return (
              <ProposalsPageApproval
                result={result}
                fragmentRef={selectedProposal.proposalData}
                proposalRef={selectedProposal}
                buttonFragmentRef={selectedProposal}
                delegateFragmentRef={result}
                queryFragmentRef={result}
                statusRef={selectedProposal}
              />
            );
          }
          case "StandardProposalData": {
            return (
              <ProposalsPageStandard
                startTransition={startTransition}
                selectedProposal={selectedProposal!}
                result={result}
                proposalId={proposalId}
                setSelectedProposalID={setSelectedProposalID}
                fragmentRef={selectedProposal.proposalData}
              />
            );
          }
        }
      })()}
    </motion.div>
  );
}
