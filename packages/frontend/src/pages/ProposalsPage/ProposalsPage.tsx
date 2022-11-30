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
import { useAccount } from "wagmi";
import {
  useNavigate,
  useParams,
} from "../../components/HammockRouter/HammockRouter";

export function ProposalsPage() {
  const { proposalId } = useParams();
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();
  let setSelectedProposalID = (newProposalID: number) => {
    startTransition(() => {
      navigate({ path: `/proposals/${newProposalID}` });
    });
  };
  const [proposalsListExpanded, setExpanded] = useState<boolean>(false);
  const { address: accountAddress } = useAccount();

  // 0 nouns
  // const accountAddress = "0x18E95FCD7a5A8Fa2439d24f5688DA4FBE744bD60";
  // 1 noun
  // const accountAddress = "nouns.llamagov.eth";
  // Many nouns
  // const accountAddress = "nouncil.eth";

  const result = useLazyLoadQuery<ProposalsPageDetailQuery>(
    graphql`
      query ProposalsPageDetailQuery(
        $proposalID: ID!
        $address: String!
        $skipAddressQuery: Boolean!
      ) {
        firstProposal: proposal(id: $proposalID) {
          number
          ...ProposalDetailPanelFragment
          ...VotesCastPanelFragment @arguments(address: $address)
        }
        ...ProposalsListPanelFragment @arguments(proposalID: $proposalID)
        address(addressOrEnsName: $address) @skip(if: $skipAddressQuery) {
          ...CastVoteDialogFragment
        }
      }
    `,
    {
      proposalID: proposalId,
      address: accountAddress ?? "",
      skipAddressQuery: !accountAddress,
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
          gap="0"
          justifyContent="space-between"
          className={css`
            position: sticky;
            top: ${theme.spacing["20"]};
            flex-shrink: 0;
            width: ${theme.maxWidth.sm};
            background-color: ${theme.colors.white};
            border: 1px solid ${theme.colors.gray.eb};
            border-radius: ${theme.borderRadius["xl"]};
            box-shadow: ${theme.boxShadow.newDefault};
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              align-items: stretch;
              justify-content: flex-end;
              width: 100%;
            }
          `}
        >
          <ProposalsListPanel
            fragmentRef={result}
            setSelectedProposalID={(nextProposalID: number) => {
              startTransition(() => {
                setSelectedProposalID(nextProposalID);
              });
            }}
            // TODO: If we don't want to use collapse the comments panel when expanding the proposals list,
            // we can move this code into the component instead.
            expanded={proposalsListExpanded}
            setExpanded={setExpanded}
          />
          <VotesCastPanel
            fragmentRef={selectedProposal!}
            dialogFragmentRef={
              result.address == undefined ? null : result.address
            }
            expanded={proposalsListExpanded}
          />
          {/* {!proposalsListExpanded && <VotesCastPanel fragmentRef={selectedProposal!} dialogFragmentRef={result.address == undefined ? null : result.address} />} */}
        </VStack>
      </HStack>
    </motion.div>
  );
}