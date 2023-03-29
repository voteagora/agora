import { HStack, VStack } from "../../components/VStack";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { useState, useTransition } from "react";
import {
  useNavigate,
  useParams,
} from "../../components/HammockRouter/HammockRouter";
import { AuctionDetailPanel } from "./AuctionDetailPanel";
import { motion } from "framer-motion";
import {
  ProposalsListPanel,
  selectedProposalToPath,
} from "../ProposalsPage/ProposalListPanel/ProposalsListPanel";
import graphql from "babel-plugin-relay/macro";
import { useLazyLoadQuery } from "react-relay/hooks";
import { PropHouseAuctionPageQuery } from "./__generated__/PropHouseAuctionPageQuery.graphql";
import { PropHousePastVotes } from "./PropHousePastVotes";
import { useAccount } from "wagmi";
import { PendingVotesProvider } from "./PendingVotesContext";

// nouns
const stagingCommunityAddress = "0x0000000000000000000000000000000000000000";
const productionCommunityAddress = "0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03";

export const COMMUNITY_ADDRESS = productionCommunityAddress;

export function PropHouseAuctionPage() {
  const { auctionId } = useParams();
  const { address: currentAccountAddress } = useAccount();

  const result = useLazyLoadQuery<PropHouseAuctionPageQuery>(
    graphql`
      query PropHouseAuctionPageQuery(
        $auctionId: String!
        $currentAccountAddress: String!
        $skip: Boolean!
      ) {
        delegate(addressOrEnsName: $currentAccountAddress) @skip(if: $skip) {
          # eslint-disable-next-line relay/must-colocate-fragment-spreads
          ...ActionButtonVoteButtonDelegateFragment
        }

        ...ProposalsListPanelFragment

        propHouseAuction(auctionId: $auctionId) {
          number

          ...AuctionDetailPanelFragment
          ...PropHousePastVotesFragment
        }
      }
    `,
    {
      auctionId,
      currentAccountAddress: currentAccountAddress ?? "",
      skip: !currentAccountAddress,
    }
  );

  const [proposalsListExpanded, setExpanded] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();

  return (
    <PendingVotesProvider>
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
          <AuctionDetailPanel fragmentRef={result.propHouseAuction} />

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
              selectedProposal={{
                type: "PROP_HOUSE_AUCTION",
                identifier: result.propHouseAuction.number.toString(),
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
            <PropHousePastVotes
              delegateFragmentRef={result.delegate}
              fragmentRef={result.propHouseAuction}
              expanded={!proposalsListExpanded}
            />
          </VStack>
        </HStack>
      </motion.div>
    </PendingVotesProvider>
  );
}
