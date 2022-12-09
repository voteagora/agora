import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css, cx } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCardFragment$key } from "./__generated__/VoterCardFragment.graphql";
import { NounResolvedName } from "../../components/NounResolvedName";
import { DelegateProfileImage } from "../../components/DelegateProfileImage";
import { HStack, VStack } from "../../components/VStack";
import { VoterPanelActions } from "../DelegatePage/VoterPanel";
import { Link } from "../../components/HammockRouter/Link";
import { UserIcon, PencilIcon } from "@heroicons/react/20/solid";
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
              icon={<PencilIcon />}
              detail={`${pluralizeVote(votesCast)} cast`}
              value={votesCast.toString()}
            />
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
};

function TitleDetail({ detail, value, icon }: TitleDetailProps) {
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
        className={css`
          width: ${theme.spacing["4"]};
          height: ${theme.spacing["4"]};
        `}
      >
        {icon}
      </div>

      <div>{value}</div>

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
