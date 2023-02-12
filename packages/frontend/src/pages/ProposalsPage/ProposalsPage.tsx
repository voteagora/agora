import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { ProposalsPageDetailQuery } from "./__generated__/ProposalsPageDetailQuery.graphql";
import { HStack, VStack } from "../../components/VStack";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { ProposalDetailPanel } from "./ProposalDetailPanel";
import { VotesCastPanel } from "./VotesCastPanel";
import { ProposalsListPanel } from "./ProposalsListPanel";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  useNavigate,
  useParams,
} from "../../components/HammockRouter/HammockRouter";

export default function ProposalsPage() {
  const { proposalId } = useParams();
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();
  let setSelectedProposalID = (newProposalID: string) => {
    startTransition(() => {
      navigate({ path: `/proposals/${newProposalID}` });
    });
  };
  const [proposalsListExpanded, setExpanded] = useState<boolean>(!proposalId);

  const result = useLazyLoadQuery<ProposalsPageDetailQuery>(
    graphql`
      query ProposalsPageDetailQuery($proposalId: ID!) {
        firstProposal: proposal(id: $proposalId) {
          number
          ...ProposalDetailPanelFragment
          ...VotesCastPanelFragment
        }
        ...ProposalsListPanelFragment
        ...VotesCastPanelVotesFragment @arguments(proposalId: $proposalId)
      }
    `,
    {
      proposalId,
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
        <ProposalDetailPanel fragmentRef={selectedProposal!} />

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
            fragmentRef={selectedProposal!}
            queryFragmentRef={result}
            expanded={proposalsListExpanded}
          />
        </VStack>
      </HStack>
    </motion.div>
  );
}
