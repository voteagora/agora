import { useFragment, graphql } from "react-relay";
import { css } from "@emotion/css";
import { BigNumber } from "ethers";
import { formatDistanceToNow } from "date-fns";
import { toSupportType } from "@agora/common";

import { VoteReason } from "../../components/VoteReason";
import { pluralizeVote } from "../../words";
import { VStack } from "../../components/VStack";
import * as theme from "../../theme";
import { ProposalLink } from "../../components/ProposalLink";

import {
  colorForSupportType,
  ValuePart,
  VoteDetailsContainer,
  VoteTitle,
} from "./VoteDetailsContainer";
import { VoteDetailsFragment$key } from "./__generated__/VoteDetailsFragment.graphql";

type Props = {
  voteFragment: VoteDetailsFragment$key;
};

export function VoteDetails({ voteFragment }: Props) {
  const vote = useFragment(
    graphql`
      fragment VoteDetailsFragment on Vote {
        reason
        ...VoteReasonFragment
        supportDetailed
        votes {
          amount {
            amount
          }
        }

        approximateTimestamp

        proposal {
          number
          title

          ...ProposalLinkFragment

          ethValue
          usdcValue
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
            <ValuePart
              ethValue={vote.proposal.ethValue}
              usdcValue={vote.proposal.usdcValue}
            />
            - {formatDistanceToNow(new Date(vote.approximateTimestamp))} ago
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
            with {pluralizeVote(BigNumber.from(vote.votes.amount.amount))}
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
                padding: ${theme.spacing["4"]} ${theme.spacing["6"]};

                @media (max-width: ${theme.maxWidth["2xl"]}) {
                  padding-top: 0;
                  height: fit-content;
                }
              `}
            >
              <VoteReason fragmentKey={vote} />
            </VStack>
          </>
        )}
      </div>
    </VoteDetailsContainer>
  );
}
