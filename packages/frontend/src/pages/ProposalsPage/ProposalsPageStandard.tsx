import { ProposalsPageDetailQuery$data } from "./__generated__/ProposalsPageDetailQuery.graphql";
import { HStack, VStack } from "../../components/VStack";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { ProposalDetailPanel } from "./ProposalDetailPanel";
import { VotesCastPanel } from "./VotesCastPanel";
import { ProposalsListPanel } from "./ProposalsListPanel";
import { ProposalDetailPanelFragment$key } from "./__generated__/ProposalDetailPanelFragment.graphql";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { ProposalsPageStandardDataFragment$key } from "./__generated__/ProposalsPageStandardDataFragment.graphql";
import { useState } from "react";

type Props = {
  startTransition: React.TransitionStartFunction;
  selectedProposal: ProposalDetailPanelFragment$key;
  result: ProposalsPageDetailQuery$data;
  proposalId: string;
  setSelectedProposalID: (nextProposalID: string) => void;
  fragmentRef: ProposalsPageStandardDataFragment$key;
};

export default function ProposalsPageStandard({
  startTransition,
  result,
  proposalId,
  setSelectedProposalID,
  fragmentRef,
}: Props) {
  const selectedProposal = result.firstProposal;
  const [proposalsListExpanded, setExpanded] = useState<boolean>(!proposalId);

  const proposalData = useFragment(
    graphql`
      fragment ProposalsPageStandardDataFragment on StandardProposalData {
        ...ProposalDetailPanelCodeChangesFragment
        ...VotesCastPanelFragment
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
      <ProposalDetailPanel
        fragmentRef={selectedProposal!}
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
        <ProposalsListPanel
          fragmentRef={result}
          selectedProposalId={selectedProposal?.number ?? null}
          expanded={proposalsListExpanded}
          setSelectedProposalID={(nextProposalID: string) => {
            startTransition(() => {
              setExpanded(false);
              setSelectedProposalID(nextProposalID);
            });
          }}
          toggleExpanded={() => setExpanded((expanded) => !expanded)}
        />
        <VotesCastPanel
          fragmentRef={proposalData}
          queryFragmentRef={result}
          castVoteInputRef={selectedProposal}
          propVotesSummaryRef={selectedProposal}
          expanded={proposalsListExpanded}
          proposalFragmentRef={selectedProposal}
        />
      </VStack>
    </HStack>
  );
}
