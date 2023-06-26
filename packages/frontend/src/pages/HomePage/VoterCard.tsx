import { useFragment, graphql } from "react-relay";
import { css, cx, keyframes } from "@emotion/css";
import {
  UserIcon,
  ChatBubbleOvalLeftIcon,
  FireIcon,
} from "@heroicons/react/20/solid";
import { ReactNode } from "react";
import { BigNumber } from "ethers";
import { GOVPOOL_CONTRACT_ADDRESS } from "@agora/common";

import { NounResolvedName } from "../../components/NounResolvedName";
import { DelegateProfileImage } from "../../components/DelegateProfileImage";
import { HStack, VStack } from "../../components/VStack";
import { VoterPanelActions } from "../../components/VoterPanel/VoterPanelActions";
import { Link } from "../../components/HammockRouter/Link";
import * as theme from "../../theme";
import { pluralizeNoun, pluralizeVote } from "../../words";
import { Tooltip } from "../../components/Tooltip";

import { VoterCardFragment$key } from "./__generated__/VoterCardFragment.graphql";

type VoterCardProps = {
  fragmentRef: VoterCardFragment$key;
  contentClassName?: string;
};

export function VoterCard({ fragmentRef, contentClassName }: VoterCardProps) {
  const delegate = useFragment(
    graphql`
      fragment VoterCardFragment on Delegate {
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

        # eslint-disable-next-line relay/unused-fields
        id
        totalTokensRepresented {
          amount {
            amount
          }
        }

        delegateMetrics {
          totalVotes
          consecutiveVotes
        }
      }
    `,
    fragmentRef
  );

  const nounsRepresented = BigNumber.from(
    delegate.totalTokensRepresented.amount.amount
  );

  const votesCast = BigNumber.from(delegate.delegateMetrics.totalVotes);
  const votingStreak = delegate.delegateMetrics.consecutiveVotes;
  const isGovernancePool =
    delegate.address.resolvedName.address === GOVPOOL_CONTRACT_ADDRESS;

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
          gap="4"
          className={cx(
            contentClassName,
            css`
              height: 100%;
            `
          )}
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
              {isGovernancePool ? (
                <span>Governance Pool</span>
              ) : (
                <NounResolvedName
                  resolvedName={delegate.address.resolvedName}
                />
              )}
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

        &:hover > #tooltip {
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

      <Tooltip text={detail} />
    </HStack>
  );
}
