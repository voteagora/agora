import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoteDetailsFragment$key } from "./__generated__/VoteDetailsFragment.graphql";
import { VStack } from "../../components/VStack";
import {
  colorForSupportType,
  toSupportType,
  ValuePart,
  VoteDetailsContainer,
  VoteTitle,
} from "./VoteDetailsContainer";
import { pluralizeVote } from "../../words";
import { BigNumber } from "ethers";
import { formatDistanceToNow } from "date-fns";
import { ProposalLink } from "../../components/ProposalLink";

type Props = {
  voteFragment: VoteDetailsFragment$key;
};

export function parseCreatedAt(raw: string) {
  return new Date(Number(raw) * 1000);
}

export function VoteDetails({ voteFragment }: Props) {
  const vote = useFragment(
    graphql`
      fragment VoteDetailsFragment on Vote {
        reason
        supportDetailed
        votes
        createdAt

        proposal {
          number
          title

          ...ProposalLinkFragment

          totalValue
          proposer {
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }
        }
      }
    `,
    voteFragment
  );

  const supportType = toSupportType(vote.supportDetailed);

  return (
    <VoteDetailsContainer>
      <div
        className={css`
          display: grid;
          overflow-y: hidden;
          grid-template-columns: 1fr 1px 1fr;

          @media (max-width: ${theme.maxWidth["2xl"]}) {
            grid-template-rows: 1fr;
            grid-template-columns: none;
            overflow-y: scroll;
          }
        `}
      >
        <VStack
          className={css`
            padding: ${theme.spacing["4"]} ${theme.spacing["6"]};
          `}
        >
          <div
            className={css`
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.medium};
              color: #66676b;
            `}
          >
            <ProposalLink fragmentRef={vote.proposal}>
              Prop {vote.proposal.number}
            </ProposalLink>
            <ValuePart value={vote.proposal.totalValue} />
            {vote.createdAt &&
              ` - ${formatDistanceToNow(parseCreatedAt(vote.createdAt))} ago`}
          </div>

          <VoteTitle>
            <ProposalLink fragmentRef={vote.proposal}>
              {vote.proposal.title}
            </ProposalLink>
          </VoteTitle>

          <span
            className={css`
              color: ${colorForSupportType(supportType)};
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.medium};
            `}
          >
            <span
              className={css`
                text-transform: capitalize;
              `}
            >
              {supportType.toLowerCase()}
            </span>{" "}
            with {pluralizeVote(BigNumber.from(vote.votes))}
          </span>
        </VStack>

        {vote.reason && (
          <>
            <div
              className={css`
                width: ${theme.spacing.px};
                background: #ebebeb;

                @media (max-width: ${theme.maxWidth["2xl"]}) {
                  display: none;
                }
              `}
            />

            <VStack
              className={css`
                overflow-y: scroll;
                overflow-x: scroll;
                padding: ${theme.spacing["4"]} ${theme.spacing["6"]};

                @media (max-width: ${theme.maxWidth["2xl"]}) {
                  padding-top: 0;
                  height: fit-content;
                }
              `}
            >
              <pre
                className={css`
                  font-size: ${theme.fontSize.xs};
                  font-weight: ${theme.fontWeight.medium};
                  color: #66676b;
                  width: fit-content;
                `}
              >
                {vote.reason}
              </pre>
            </VStack>
          </>
        )}
      </div>
    </VoteDetailsContainer>
  );
}
