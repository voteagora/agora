import { HStack, VStack } from "../../../components/VStack";
import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { ApprovalProposalDetailPanel } from "./ApprovalProposalDetailPanel";
import { ProposalsPageDetailQuery$data } from "../__generated__/ProposalsPageDetailQuery.graphql";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { ProposalsPageApprovalDataFragment$key } from "./__generated__/ProposalsPageApprovalDataFragment.graphql";
import { ApprovalProposalsListPanel } from "./ApprovalProposalsListPanel";
import { ApprovalProposalCriteriaQuorumVotesFragment$key } from "./__generated__/ApprovalProposalCriteriaQuorumVotesFragment.graphql";
import { ApprovalCastVoteButtonFragment$key } from "./__generated__/ApprovalCastVoteButtonFragment.graphql";
import { ApprovalCastVoteButtonDelegateFragment$key } from "./__generated__/ApprovalCastVoteButtonDelegateFragment.graphql";
import { VotesListPanelQueryFragment$key } from "./__generated__/VotesListPanelQueryFragment.graphql";
import { OptionsResultsPanelStatusFragment$key } from "./__generated__/OptionsResultsPanelStatusFragment.graphql";

type Props = {
  result: ProposalsPageDetailQuery$data;
  fragmentRef: ProposalsPageApprovalDataFragment$key;
  proposalRef: ApprovalProposalCriteriaQuorumVotesFragment$key;
  buttonFragmentRef: ApprovalCastVoteButtonFragment$key;
  delegateFragmentRef: ApprovalCastVoteButtonDelegateFragment$key;
  queryFragmentRef: VotesListPanelQueryFragment$key;
  statusRef: OptionsResultsPanelStatusFragment$key;
};

export default function ProposalsPageApproval({
  result,
  fragmentRef,
  proposalRef,
  buttonFragmentRef,
  delegateFragmentRef,
  queryFragmentRef,
  statusRef,
}: Props) {
  const selectedProposal = result.firstProposal;
  const proposalData = useFragment(
    graphql`
      fragment ProposalsPageApprovalDataFragment on ApprovalVotingProposalData {
        ...ApprovalProposalDetailPanelCodeChangesFragment
        # eslint-disable-next-line relay/must-colocate-fragment-spreads
        ...OptionsResultsPanelFragment
        # eslint-disable-next-line relay/must-colocate-fragment-spreads
        ...ApprovalProposalCriteriaFragment
        # eslint-disable-next-line relay/must-colocate-fragment-spreads
        ...ApprovalCastVoteDialogFragment
      }
    `,
    fragmentRef
  );

  return (
    <HStack
      gap="16"
      justifyContent="space-between"
      alignItems="flex-start"
      className={css`
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
        max-width: ${theme.maxWidth["6xl"]};
        @media (max-width: ${theme.maxWidth["2xl"]}) {
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-end;
        }
      `}
    >
      <ApprovalProposalDetailPanel
        fragmentRef={selectedProposal}
        codeChangesFragment={proposalData}
      />
      <VStack
        justifyContent="space-between"
        className={css`
          position: sticky;
          top: ${theme.spacing["20"]};
          max-height: calc(100vh - 148px);
          flex-shrink: 0;
          width: ${theme.maxWidth.sm};
          background-color: ${theme.colors.white};
          border: 1px solid ${theme.colors.gray.eb};
          border-radius: ${theme.borderRadius["xl"]};
          box-shadow: ${theme.boxShadow.newDefault};
          margin-bottom: ${theme.spacing["8"]};
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            align-items: stretch;
            justify-content: flex-end;
            width: 100%;
            height: auto;
          }
        `}
      >
        <ApprovalProposalsListPanel
          criteriaFragmentRef={proposalData}
          optionsFragmentRef={proposalData}
          castVoteFragmentRef={proposalData}
          buttonFragmentRef={buttonFragmentRef}
          proposalRef={proposalRef}
          delegateFragmentRef={delegateFragmentRef}
          queryFragmentRef={queryFragmentRef}
          statusRef={statusRef}
        />
      </VStack>
    </HStack>
  );
}
