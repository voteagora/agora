import { useLazyLoadQuery } from "react-relay/hooks";
import { graphql } from "react-relay";
import { css } from "@emotion/css";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";

import { HStack, VStack } from "../../components/VStack";
import * as theme from "../../theme";
import {
  useNavigate,
  useParams,
} from "../../components/HammockRouter/HammockRouter";

import { ProposalsPageDetailQuery } from "./__generated__/ProposalsPageDetailQuery.graphql";
import { ProposalDetailPanel } from "./ProposalDetailPanel";
import { VotesCastPanel } from "./VotesCastPanel";
import {
  ProposalsListPanel,
  selectedProposalToPath,
} from "./ProposalListPanel/ProposalsListPanel";

export default function ProposalsPage() {
  const { proposalId } = useParams();
  const { address } = useAccount();

  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();

  const [proposalsListExpanded, setExpanded] = useState<boolean>(!proposalId);

  const result = useLazyLoadQuery<ProposalsPageDetailQuery>(
    graphql`
      query ProposalsPageDetailQuery(
        $proposalId: ID!
        $address: String!
        $skipAddress: Boolean!
      ) {
        firstProposal: proposal(id: $proposalId) {
          number
          ...ProposalDetailPanelFragment
          ...VotesCastPanelFragment
        }
        ...ProposalsListPanelFragment

        ...VotesCastPanelQueryFragment
          @arguments(
            address: $address
            skipAddress: $skipAddress
            proposalId: $proposalId
          )
      }
    `,
    {
      proposalId,
      address: address ?? "",
      skipAddress: !address,
    }
  );

  // This happens if user enters an invalid proposal
  // TODO: Show a 404 page instead
  if (!result?.firstProposal?.number) {
    startTransition(() => {
      navigate({ path: "/proposals" });
    });
    return null;
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
        <ProposalDetailPanel fragmentRef={result.firstProposal} />

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
              position: fixed;
              left: 16px;
              top: calc(100% - 204px);
              height: 192px;
              align-items: stretch;
              justify-content: flex-end;
              width: calc(100% - 32px);
            }
          `}
        >
          <ProposalsListPanel
            fragmentRef={result}
            selectedProposal={{
              type: "ON_CHAIN",
              identifier: result.firstProposal.number.toString(),
            }}
            expanded={proposalsListExpanded}
            onProposalSelected={(nextSelected) =>
              startTransition(() => {
                setExpanded(false);
                navigate({
                  path: selectedProposalToPath(nextSelected),
                });
              })
            }
            toggleExpanded={() => setExpanded((expanded) => !expanded)}
          />
          <VotesCastPanel
            fragmentRef={result.firstProposal}
            queryFragmentRef={result}
            expanded={proposalsListExpanded}
          />
        </VStack>
      </HStack>
    </motion.div>
  );
}
