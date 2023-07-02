import { css } from "@emotion/css";
import { graphql, useLazyLoadQuery, usePreloadedQuery } from "react-relay";

import * as theme from "../../theme";
import { RoutePropsForRoute } from "../../components/HammockRouter/HammockRouter";
import { HStack, VStack } from "../../components/VStack";

import { proposalsListPageRoute, query } from "./ProposalsListPageRoute";
import { useProposals } from "./useProposals";
import { OnChainProposalRow } from "./OnChainProposalRow";
import { PropHouseAuctionRow } from "./PropHouseAuctionRow";
import { NonVotedProposalsListQuery } from "./__generated__/NonVotedProposalsListQuery.graphql";

export default function NonVotedProposalsListPage({
  address,
  initialQueryRef,
}: {
  address: `0x${string}`;
  initialQueryRef: RoutePropsForRoute<
    typeof proposalsListPageRoute
  >["initialQueryRef"];
}) {
  const result = usePreloadedQuery(query, initialQueryRef);
  const proposals = useProposals(result, "NEWEST", "ALL", "ALL");

  const votesData = useLazyLoadQuery<NonVotedProposalsListQuery>(
    graphql`
      query NonVotedProposalsListQuery($address: String!) {
        delegate(addressOrEnsName: $address) {
          propHouseVotes {
            id
            round {
              id
            }
          }
          votes {
            id
            proposal {
              id
            }
          }
        }
      }
    `,
    { address: address }
  );

  const propHouseVoteIds = new Set(
    votesData.delegate.propHouseVotes.map(
      (vote: { round: any }) => vote.round.id
    )
  );

  const votedProposalIds = new Set([
    ...votesData.delegate.votes.map(
      (vote: { proposal: { id: any } }) => vote.proposal.id
    ),
    ...Array.from(propHouseVoteIds),
  ]);

  const notVotedProposals = proposals.filter((item) => {
    if (item.type === "ON_CHAIN") {
      return (
        !votedProposalIds.has(item.proposal.id) &&
        item.proposal.status === "ACTIVE"
      );
    } else if (item.type === "PROP_HOUSE_AUCTION") {
      return (
        !votedProposalIds.has(item.auction.id) &&
        item.auction.status === "ACTIVE"
      );
    }
    return false;
  });

  return (
    <>
      {notVotedProposals.length > 0 && (
        <>
          <HStack
            justifyContent="space-between"
            className={css`
              margin-top: ${theme.spacing["10"]};
              @media (max-width: ${theme.maxWidth["lg"]}) {
                max-width: 100%;
                flex-direction: column;
                margin-bottom: ${theme.spacing["1"]};
                margin-top: ${theme.spacing["0"]};
              }
            `}
          >
            <h1
              className={css`
                font-size: ${theme.fontSize["2xl"]};
                font-weight: ${theme.fontWeight["extrabold"]};
                @media (max-width: ${theme.maxWidth["lg"]}) {
                  margin-bottom: ${theme.spacing["0"]};
                }
              `}
            >
              Needs my vote
            </h1>
          </HStack>

          <VStack
            className={css`
              margin: ${theme.spacing["4"]} 0 0 0;
              border: 1px solid ${theme.colors.gray[300]};
              border-radius: ${theme.borderRadius["xl"]};
              box-shadow: ${theme.boxShadow["newDefault"]};
              overflow: hidden;
              @media (max-width: ${theme.maxWidth["lg"]}) {
                margin-top: ${theme.spacing["2"]};
              }
            `}
          >
            <table
              className={css`
                table-layout: fixed;
                width: 100%;
                border-collapse: collapse;
                background-color: ${theme.colors.white};
              `}
            >
              <tbody>
                {notVotedProposals.map((proposal, idx) => {
                  switch (proposal.type) {
                    case "PROP_HOUSE_AUCTION":
                      return import.meta.env.VITE_DEPLOY_ENV === "prod" ? (
                        <PropHouseAuctionRow
                          key={idx}
                          fragmentRef={proposal.auction}
                        />
                      ) : null;
                    case "ON_CHAIN":
                      return (
                        <OnChainProposalRow
                          key={idx}
                          fragmentRef={proposal.proposal}
                        />
                      );

                    default:
                      throw new Error(`unknown proposal type`);
                  }
                })}
              </tbody>
            </table>
          </VStack>
        </>
      )}
    </>
  );
}
