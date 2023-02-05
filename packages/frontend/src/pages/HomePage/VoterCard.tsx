import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css, cx, keyframes } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCardFragment$key } from "./__generated__/VoterCardFragment.graphql";
import { NounResolvedName } from "../../components/NounResolvedName";
import { DelegateProfileImage } from "../../components/DelegateProfileImage";
import { HStack, VStack } from "../../components/VStack";
import { VoterPanelActions } from "../DelegatePage/VoterPanel";
import { Link } from "../../components/HammockRouter/Link";
import {
  UserIcon,
  ChatBubbleOvalLeftIcon,
  FireIcon,
} from "@heroicons/react/20/solid";
import { ReactNode } from "react";
import { BigNumber } from "ethers";
import { pluralizeNoun, pluralizeVote } from "../../words";

type VoterCardProps = {
  fragmentRef: VoterCardFragment$key;
};

export function VoterCard({ fragmentRef }: VoterCardProps) {
  const delegate = useFragment(
    graphql`
      fragment VoterCardFragment on WrappedDelegate {
        ...VoterPanelActionsFragment

        ...DelegateProfileImageFragment

        address {
          resolvedName {
            address
            name

            ...NounResolvedNameFragment
          }
        }

        statement {
          statement
          summary
        }

        delegate {
          id
          delegatedVotesRaw
          nounsRepresented {
            __typename
          }
          votes {
            id

            proposal {
              id
              number
            }
          }
          voteSummary {
            totalVotes
          }
        }
      }
    `,
    fragmentRef
  );

  const nounsRepresented = BigNumber.from(
    delegate.delegate?.delegatedVotesRaw ?? "0"
  );

  const votesCast = BigNumber.from(
    delegate.delegate?.voteSummary?.totalVotes ?? 0
  );

  const allVotesCast =
    delegate.delegate?.votes
      .map((vote) => +vote.proposal.number)
      .sort((a, b) => b - a) ?? [];
  // console.log(allVotesCast)
  let votingStreak = 0;

  for (let i = 0; i < allVotesCast.length; i++) {
    if (i === 0) {
      votingStreak++;
    }
    if (allVotesCast[i] === allVotesCast[i + 1] + 1) {
      votingStreak++;
    } else {
      break;
    }
  }
  console.log(allVotesCast);
  console.log(delegate.address.resolvedName.name);
  console.log(votingStreak);
  console.log("----");

  return (
    <Link
      to={`/delegate/${
        delegate.address.resolvedName.name ??
        delegate.address.resolvedName.address
      }`}
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <VStack
        gap="4"
        className={css`
          height: 100%;
          padding: ${theme.spacing["6"]};
          border-radius: ${theme.spacing["3"]};
          background: ${theme.colors.white};
          border-width: ${theme.spacing.px};
          border-color: ${theme.colors.gray["300"]};
          box-shadow: ${theme.boxShadow.newDefault};
          cursor: pointer;
        `}
      >
        <VStack
          justifyContent="center"
          alignItems="center"
          className={css`
            flex: 1;
          `}
        >
          <DelegateProfileImage fragment={delegate} />
        </VStack>

        <HStack
          justifyContent="space-between"
          className={css`
            margin-top: ${theme.spacing["2"]};
          `}
        >
          <div
            className={css`
              font-weight: ${theme.fontWeight.semibold};
            `}
          >
            <NounResolvedName resolvedName={delegate.address.resolvedName} />
          </div>

          <HStack
            gap="2"
            className={css`
              color: #66676b;
            `}
          >
            <TitleDetail
              icon={<UserIcon />}
              detail={`${pluralizeNoun(nounsRepresented)} represented`}
              value={nounsRepresented.toString()}
            />

            <TitleDetail
              icon={<ChatBubbleOvalLeftIcon />}
              detail={`${pluralizeVote(votesCast)} cast`}
              value={votesCast.toString()}
            />
            {votingStreak > 2 && (
              <TitleDetail
                icon={<FireIcon />}
                detail={`Casted ` + votingStreak + ` votes consecutively`}
                value={votingStreak.toString()}
                streak={votingStreak}
              />
            )}
          </HStack>
        </HStack>

        {!!delegate.statement?.summary && (
          <div
            className={css`
              display: -webkit-box;

              color: #66676b;
              overflow: hidden;
              text-overflow: ellipsis;
              line-clamp: 5;
              -webkit-line-clamp: 5;
              -webkit-box-orient: vertical;
              font-size: ${theme.fontSize.base};
              line-height: ${theme.lineHeight.normal};
            `}
          >
            {delegate.statement.summary}
          </div>
        )}

        <VoterPanelActions fragment={delegate} />
      </VStack>
    </Link>
  );
}

type TitleDetailProps = {
  icon: ReactNode;
  detail: string;
  value: string;
  streak?: number;
};

function TitleDetail({ detail, value, icon, streak = 0 }: TitleDetailProps) {
  const fire = keyframes`
  from {
    color: #eb442b;
  }
  50%{
    color: #f19a18;
  }
  to {
    color: #eb442b;
  }
`;
  const normal = css`
    width: ${theme.spacing["4"]};
    height: ${theme.spacing["4"]};
  `;
  const unstoppable = css`
    color: #a79875;
  `;
  const wickedSick = css`
    color: #c86640;
    animation: ${fire} 2s ease-in-out infinite;
    transform-origin: center bottom;
  `;

  return (
    <HStack
      gap="1"
      alignItems="center"
      className={css`
        position: relative;

        &:hover .test {
          visibility: visible;
        }
      `}
    >
      <div
        className={cx(
          normal,
          { [unstoppable]: streak > 9 },
          { [wickedSick]: streak > 19 }
        )}
      >
        {icon}
      </div>

      <div
        className={cx(
          { [unstoppable]: streak > 9 },
          { [wickedSick]: streak > 19 }
        )}
      >
        {value}
      </div>

      <div
        className={cx(
          css`
            position: absolute;
            top: calc(100% + ${theme.spacing["1"]});
            right: -${theme.spacing["2"]};

            font-size: ${theme.fontSize.sm};
            white-space: nowrap;
            visibility: hidden;
            background: #66676b;
            border-radius: ${theme.spacing["1"]};
            color: white;

            padding: ${theme.spacing["1"]} ${theme.spacing["2"]};
          `,
          "test"
        )}
      >
        {detail}
      </div>
    </HStack>
  );
}
