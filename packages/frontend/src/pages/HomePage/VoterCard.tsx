import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css, cx } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCardFragment$key } from "./__generated__/VoterCardFragment.graphql";
import { NounResolvedName } from "../../components/NounResolvedName";
import { NounsRepresentedGrid } from "../../components/NounGrid";
import { HStack, VStack } from "../../components/VStack";
import { icons } from "../../icons/icons";
import { VoterPanelActions } from "../DelegatePage/VoterPanel";
import { VoterCardDelegateProfileImage$key } from "./__generated__/VoterCardDelegateProfileImage.graphql";
import { Link } from "../../components/HammockRouter/Link";
import { UserIcon, PencilIcon } from "@heroicons/react/20/solid";
import { ReactNode } from "react";
import { useEnsAvatar } from "wagmi";
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

        ...VoterCardDelegateProfileImage

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
    delegate?.delegate?.delegatedVotesRaw ?? "0"
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

export function DelegateProfileImage({
  fragment,
  dense,
}: {
  fragment: VoterCardDelegateProfileImage$key;
  dense?: boolean;
}) {
  const delegate = useFragment(
    graphql`
      fragment VoterCardDelegateProfileImage on WrappedDelegate {
        address {
          resolvedName {
            address
          }
        }
        delegate {
          nounsRepresented {
            id
          }

          ...NounGridFragment
        }
      }
    `,
    fragment
  );

  const avatar = useEnsAvatar({
    addressOrName: delegate.address.resolvedName.address,
  });

  return !delegate.delegate ? (
    <HStack
      alignItems="center"
      className={css`
        border-radius: ${theme.borderRadius.full};
        border: 1px solid ${theme.colors.gray.eb};
        box-shadow: ${theme.boxShadow.newDefault};
        margin: ${theme.spacing["4"]} 0;
      `}
    >
      <img
        className={css`
          width: 44px;
          height: 44px;
          border-radius: 100%;
        `}
        src={avatar.data || icons.anonNoun}
        alt={"anon noun"}
      />
      <div
        className={css`
          font-size: ${theme.fontSize.sm};
          font-weight: ${theme.fontWeight.semibold};
          padding: 0 ${theme.spacing["4"]};
        `}
      >
        Currently seeking delegation
      </div>
    </HStack>
  ) : !delegate.delegate.nounsRepresented.length ? (
    <VStack
      justifyContent="center"
      alignItems="center"
      className={css`
        color: #afafaf;
        min-height: 44px;
        font-size: ${theme.fontSize.sm};
        margin: 0 ${theme.spacing["10"]};
        border-radius: ${theme.borderRadius.full};
        border: 1px solid ${theme.colors.gray.eb};
        box-shadow: ${theme.boxShadow.newDefault};
        margin: ${theme.spacing["4"]} 0;
        width: 100%;
      `}
    >
      No longer has votes
    </VStack>
  ) : (
    <NounsRepresentedGrid
      rows={3}
      columns={dense ? 6 : 5}
      gap={dense ? "2" : "4"}
      imageSize={dense ? "10" : "12"}
      overflowFontSize="base"
      fragmentKey={delegate.delegate}
    />
  );
}
