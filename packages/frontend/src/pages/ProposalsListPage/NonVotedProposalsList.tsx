import { useState } from "react";
import { css, keyframes } from "@emotion/css";
import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import AgoraLogo from "../../logo.svg";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { NounResolvedName } from "../../components/NounResolvedName";
import { ENSAvatar } from "../../components/ENSAvatar";

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
          address {
            resolvedName {
              address
              name
              ...NounResolvedNameFragment
              ...ENSAvatarFragment
            }
          }
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
            transition: all 200ms ease-in-out;
            width: ${theme.maxWidth["xl"]};
            height: ${theme.maxWidth["xs"]};
            position: fixed;
            right: calc(50vw - 692px);
            bottom: ${theme.spacing["8"]};
            animation: ${isAnimated ? `${animation} 200ms forwards` : "none"};
            outline: 1px solid rgba(0, 0, 0, 0);
            border: 8px solid rgba(0, 0, 0, 0);
            :hover {
              background-color: ${theme.colors.gray[100]};
              border-radius: ${theme.borderRadius["xl"]};
              outline: 1px solid ${theme.colors.gray[300]};
              border: 8px solid white;
              box-shadow: ${theme.boxShadow["xl"]};
              bottom: ${theme.spacing["16"]};
              transform: rotate(2deg) translateX(-12px);
            }
            @media (max-width: ${theme.maxWidth["6xl"]}) {
              right: ${theme.spacing["0"]};
              bottom: ${theme.spacing["0"]};
              pointer-events: none;
            }
          `}
        >
          <VStack
            gap="2"
            justifyContent="center"
            className={css`
              height: 100%;
              width: 100%;
              padding: ${theme.spacing["16"]} ${theme.spacing["8"]};
              color: ${theme.colors.gray[700]};
              opacity: 0;
              transition: all 200ms ease-in-out;
              :hover {
                opacity: 1;
              }
            `}
          >
            <div
              onClick={handleClick}
              className={css`
                position: absolute;
                bottom: ${theme.spacing["6"]};
                cursor: pointer;
                opacity: 0.3;
                transition: all 200ms ease-in-out;
                :hover {
                  opacity: 1;
                }
              `}
            >
              ↓
            </div>
            <HStack
              className={css`
                position: absolute;
                top: ${theme.spacing["5"]};
                right: ${theme.spacing["5"]};
                align-items: center;
                gap: ${theme.spacing["2"]};
              `}
            >
              <NounResolvedName resolvedName={delegate.address.resolvedName} />
              <ENSAvatar
                className={css`
                  width: 32px;
                  height: 32px;
                  border-radius: 100%;
                `}
                fragment={delegate.address.resolvedName}
              />
            </HStack>

            <HStack
              gap="2"
              alignItems="center"
              className={css`
                position: absolute;
                top: ${theme.spacing["6"]};
              `}
            >
              <img
                src={AgoraLogo}
                alt="Agora logo"
                className={css`
                  width: 16px;
                `}
              />
              <div>x</div>
              <div
                className={css`
                  padding: 3px 10px;
                  background-color: ${theme.colors.partner};
                  color: ${theme.colors.white};
                  border-radius: ${theme.borderRadius["full"]};
                  font-size: ${theme.fontSize["xs"]};
                  font-weight: ${theme.fontWeight["bold"]};
                  font-style: italic;
                `}
              >
                OPTIMISM
              </div>
            </HStack>
            <div></div>
            <div
              className={css`
                font-size: ${theme.fontSize["2xl"]};
                font-weight: ${theme.fontWeight["extrabold"]};
                color: ${theme.colors.gray[900]};
                line-height: ${theme.lineHeight["tight"]};
              `}
            >
              I just voted on all active Optimism governance proposals
            </div>
            <div className={css``}>
              {delegate.address.resolvedName.name
                ? "nounsagora.com/delegate/" +
                  delegate.address.resolvedName.name
                : "Want to delegate to me? Find me on Agora!"}
            </div>
          </VStack>

          <img
            className={css`
              animation: ${rotate} 40s infinite linear;
              position: absolute;
              bottom: 24px;
              pointer-events: none;
              right: 24px;
              filter: drop-shadow(-4px 4px 4px rgba(59, 12, 0, 0.2));
            `}
            src={IVotedOnOp}
            alt="i voted on nouns badge"
          />
        </div>
      )}
    </>
  );
}
