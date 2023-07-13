import { useState } from "react";
import { css, keyframes } from "@emotion/css";
import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";

import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";

import IVotedOnOp from "./IVotedOnOp.svg";
import { OnChainProposalRow } from "./OnChainProposalRow";
import { NonVotedProposalsListQuery } from "./__generated__/NonVotedProposalsListQuery.graphql";

export default function NonVotedProposalsListPage({
  address,
}: {
  address: `0x${string}`;
}) {
  const { delegate, proposals } = useLazyLoadQuery<NonVotedProposalsListQuery>(
    graphql`
      query NonVotedProposalsListQuery($address: String!) {
        proposals {
          id
          status
          ...OnChainProposalRowFragment
        }
        delegate(addressOrEnsName: $address) {
          votes {
            id
            proposal {
              id
              status
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

  const votedProposalIds = new Set([
    ...delegate.votes.map(
      (vote: { proposal: { id: any } }) => vote.proposal.id
    ),
    [],
  ]);

  const notVotedProposals = proposals.filter(
    (proposal: { id: any; status: string }) => {
      return !votedProposalIds.has(proposal.id) && proposal.status === "ACTIVE";
    }
  );

  return (
    <>
      {notVotedProposals.length > 0 ? (
        <>
          <HStack
            justifyContent="space-between"
            className={css`
              margin-top: ${theme.spacing["12"]};
              @media (max-width: ${theme.maxWidth["lg"]}) {
                max-width: 100%;
                flex-direction: column;
                margin-bottom: ${theme.spacing["1"]};
                margin-top: ${theme.spacing["6"]};
              }
            `}
          >
            <h1
              className={css`
                font-size: ${theme.fontSize["2xl"]};
                font-weight: ${theme.fontWeight["extrabold"]};
                @media (max-width: ${theme.maxWidth["lg"]}) {
                  margin-bottom: ${theme.spacing["1"]};
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
                  return (
                    <OnChainProposalRow key={idx} fragmentRef={proposal} />
                  );
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
            src={IVotedOnOp}
            alt="i voted on nouns badge"
          />
        </div>
      )}
    </>
  );
}
