import { useState } from "react";
import { css, keyframes } from "@emotion/css";
import { graphql, useLazyLoadQuery, usePreloadedQuery } from "react-relay";

import * as theme from "../../theme";
import { RoutePropsForRoute } from "../../components/HammockRouter/HammockRouter";
import { HStack, VStack } from "../../components/VStack";

import IVotedOnNouns from "./IVotedOnNouns.svg";
import { proposalsListPageRoute, query } from "./ProposalsListPageRoute";
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
  const { nonVotedProposals } = useLazyLoadQuery<NonVotedProposalsListQuery>(
    graphql`
      query NonVotedProposalsListQuery($address: String!) {
        nonVotedProposals(addressOrEnsName: $address) {
          __typename

          ... on OnChainProposalType {
            onChainProposal {
              ...OnChainProposalRowFragment
            }
          }

          ... on PropHouseProposalType {
            propHouseProposal {
              ...PropHouseAuctionRowFragment
            }
          }
        }
      }
    `,
    { address: address }
  );

  const rotate = keyframes`
    0% {transform: rotate(0deg);}
    100% {transform: rotate(-360deg);}
  `;

  const animation = keyframes`
    0% { bottom: ${theme.spacing["6"]};}
    100% { bottom: -300px; }
  `;

  const [isAnimated, setIsAnimated] = useState(false);
  const handleClick = () => {
    setIsAnimated(true);
  };

  return (
    <>
      {nonVotedProposals.length > 0 ? (
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
                {nonVotedProposals.map((proposal, idx) => {
                  switch (proposal.__typename) {
                    case "PropHouseProposalType":
                      return import.meta.env.VITE_DEPLOY_ENV === "prod" ? (
                        <PropHouseAuctionRow
                          key={idx}
                          fragmentRef={proposal.propHouseProposal}
                        />
                      ) : null;
                    case "OnChainProposalType":
                      return (
                        <OnChainProposalRow
                          key={idx}
                          fragmentRef={proposal.onChainProposal}
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
      ) : (
        <div
          className={css`
            position: fixed;
            right: calc(50vw - 652px);
            bottom: ${theme.spacing["6"]};
            cursor: s-resize;
            animation: ${isAnimated ? `${animation} 300ms forwards` : "none"};
            @media (max-width: ${theme.maxWidth["6xl"]}) {
              right: ${theme.spacing["6"]};
            }
          `}
          onClick={handleClick}
        >
          <img
            className={css`
              animation: ${rotate} 40s infinite linear;
            `}
            src={IVotedOnNouns}
            alt="i voted on nouns badge"
          />
        </div>
      )}
    </>
  );
}
