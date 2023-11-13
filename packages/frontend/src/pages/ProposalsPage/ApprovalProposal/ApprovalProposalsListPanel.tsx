import { css } from "@emotion/css";
import { motion } from "framer-motion";
import { HStack, VStack } from "../../../components/VStack";
import * as theme from "../../../theme";
import { useState, useTransition } from "react";
import { OptionsResultsPanel } from "./OptionsResultsPanel";
import { VotesListPanel } from "./VotesListPanel";
import { OptionsResultsPanelFragment$key } from "./__generated__/OptionsResultsPanelFragment.graphql";
import { ApprovalProposalCriteriaQuorumVotesFragment$key } from "./__generated__/ApprovalProposalCriteriaQuorumVotesFragment.graphql";
import { ApprovalProposalCriteria } from "./ApprovalProposalCriteria";
import { ApprovalProposalCriteriaFragment$key } from "./__generated__/ApprovalProposalCriteriaFragment.graphql";
import { ApprovalCastVoteDialogFragment$key } from "./__generated__/ApprovalCastVoteDialogFragment.graphql";
import { ApprovalCastVoteButton } from "./ApprovalCastVoteButton";
import { ApprovalCastVoteButtonFragment$key } from "./__generated__/ApprovalCastVoteButtonFragment.graphql";
import { ApprovalCastVoteButtonDelegateFragment$key } from "./__generated__/ApprovalCastVoteButtonDelegateFragment.graphql";
import { VotesListPanelQueryFragment$key } from "./__generated__/VotesListPanelQueryFragment.graphql";
import { OptionsResultsPanelStatusFragment$key } from "./__generated__/OptionsResultsPanelStatusFragment.graphql";

type Props = {
  optionsFragmentRef: OptionsResultsPanelFragment$key;
  criteriaFragmentRef: ApprovalProposalCriteriaFragment$key;
  proposalRef: ApprovalProposalCriteriaQuorumVotesFragment$key;
  castVoteFragmentRef: ApprovalCastVoteDialogFragment$key;
  buttonFragmentRef: ApprovalCastVoteButtonFragment$key;
  delegateFragmentRef: ApprovalCastVoteButtonDelegateFragment$key;
  queryFragmentRef: VotesListPanelQueryFragment$key;
  statusRef: OptionsResultsPanelStatusFragment$key;
};

export function ApprovalProposalsListPanel({
  optionsFragmentRef,
  criteriaFragmentRef,
  proposalRef,
  castVoteFragmentRef,
  buttonFragmentRef,
  delegateFragmentRef,
  queryFragmentRef,
  statusRef,
}: Props) {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  function handleTabsChange(index: number) {
    startTransition(() => {
      setActiveTab(index);
    });
  }

  return (
    <motion.div
      className={css`
        display: flex;
        flex-direction: column;
      `}
      initial={{ opacity: 1 }}
      animate={{ opacity: isPending ? 0.3 : 1 }}
      transition={{ duration: 0.3, delay: isPending ? 0.3 : 0 }}
    >
      <VStack
        gap="1"
        className={css`
          position: relative;
          min-height: 0;
          height: 100%;
          font-family: ${theme.fontFamily.inter};
        `}
      >
        <HStack
          className={css`
            height: ${theme.spacing["12"]};
            padding-top: ${theme.spacing["4"]};
            padding-left: ${theme.spacing["4"]};
            padding-right: ${theme.spacing["4"]};
          `}
        >
          <div
            className={css`
              font-size: ${theme.fontSize.base};
              font-weight: ${theme.fontWeight.semibold};
              line-height: ${theme.lineHeight.normal};
              color: ${activeTab === 1
                ? theme.colors.black
                : theme.colors.gray.af};
              padding-right: ${theme.spacing["4"]};
              cursor: pointer;
            `}
            onClick={() => handleTabsChange(1)}
          >
            Results
          </div>
          <div
            className={css`
              font-size: ${theme.fontSize.base};
              font-weight: ${theme.fontWeight.semibold};
              line-height: ${theme.lineHeight.normal};
              color: ${activeTab === 2
                ? theme.colors.black
                : theme.colors.gray.af};
              cursor: pointer;
            `}
            onClick={() => handleTabsChange(2)}
          >
            Votes
          </div>
        </HStack>
        {activeTab === 1 ? (
          <OptionsResultsPanel
            fragmentRef={optionsFragmentRef}
            statusRef={statusRef}
          />
        ) : (
          <VotesListPanel queryFragmentRef={queryFragmentRef} />
        )}
        <ApprovalProposalCriteria
          fragmentRef={criteriaFragmentRef}
          proposalRef={proposalRef}
        />
        <div
          className={css`
            padding: 0 ${theme.spacing["4"]} ${theme.spacing["6"]}
              ${theme.spacing["4"]};
          `}
        >
          <ApprovalCastVoteButton
            castVoteFragmentRef={castVoteFragmentRef}
            buttonFragmentRef={buttonFragmentRef}
            delegateFragmentRef={delegateFragmentRef}
          />
        </div>
      </VStack>
    </motion.div>
  );
}
