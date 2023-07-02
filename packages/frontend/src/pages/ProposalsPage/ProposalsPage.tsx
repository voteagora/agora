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
import { icons } from "../../icons/icons";

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
  const [isClicked, setIsClicked] = useState(false);
  const handleClick = () => {
    setIsClicked(!isClicked);
    var div = document.getElementsByClassName("mobile-web-scroll-div")[0];
    div.scrollTop = 0;
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isPending ? 0.3 : 1 }}
      transition={{ duration: 0.3, delay: isPending ? 0.3 : 0 }}
      className={css`
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};
      `}
    >
      <HStack
        gap="16"
        justifyContent="space-between"
        alignItems="flex-start"
        className={css`
          width: 100%;
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
            transition: bottom 600ms cubic-bezier(0, 0.975, 0.015, 0.995);

            @media (max-width: ${theme.maxWidth["2xl"]}) {
              position: fixed;
              top: auto;
              left: 16px;
              max-height: calc(100% - 116px);
              height: calc(100% - 116px);
              bottom: ${isClicked ? "-16px" : "calc(-100% + 184px)"};
              align-items: stretch;
              justify-content: flex-end;
              width: calc(100% - 32px);
            }
          `}
        >
          <button
            onClick={handleClick}
            className={css`
              border: 1px solid ${theme.colors.gray.eb};
              width: 40px;
              height: 40px;
              border-radius: ${theme.borderRadius.full};
              background-color: ${theme.colors.white};
              position: absolute;
              top: -20px;
              left: calc(50% - 20px);
              box-shadow: ${theme.boxShadow.newDefault};
              display: none;
              @media (max-width: ${theme.maxWidth["2xl"]}) {
                display: block;
              }
            `}
          >
            <HStack justifyContent="center">
              <img
                className={css`
                  opacity: 60%;
                `}
                src={icons.expand}
                alt="expand"
              />
            </HStack>
          </button>
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
