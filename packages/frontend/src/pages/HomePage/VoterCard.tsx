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
  isGrid?: boolean;
};

export function VoterCard({ fragmentRef, isGrid }: VoterCardProps) {
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
      {isGrid ? (
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
      ) : (
        <HStack
          className={css`
            height: 100%;
            padding: ${theme.spacing["3"]};
            border-radius: ${theme.spacing["3"]};
            background: ${theme.colors.white};
            border-width: ${theme.spacing.px};
            border-color: ${theme.colors.gray["300"]};
            box-shadow: ${theme.boxShadow.newDefault};
            cursor: pointer;
            align-items: center;
            flex-wrap: wrap;
          `}
        >
          <VStack
            justifyContent="center"
            alignItems="start"
            className={css`
              width: 20%;
              @media (max-width: ${theme.maxWidth["4xl"]}) {
                width: 50%;
              }
            `}
          >
            <div
              className={css`
                font-weight: ${theme.fontWeight.semibold};
                display: -webkit-box;
                overflow: hidden;
                text-overflow: ellipsis;
                line-clamp: 1;
                -webkit-line-clamp: 1;
                -webkit-box-orient: vertical;
                width: 90%;
                @media (max-width: ${theme.maxWidth["4xl"]}) {
                  font-size: ${theme.fontSize.xs};
                }
              `}
            >
              <NounResolvedName resolvedName={delegate.address.resolvedName} />
            </div>
            <DelegateProfileImage dense flat fragment={delegate} />
          </VStack>

          <HStack
            justifyContent="space-between"
            className={css`
              margin-top: ${theme.spacing["2"]};
              width: 30%;
              @media (max-width: ${theme.maxWidth["4xl"]}) {
                width: 50%;
              }
            `}
          >
            <HStack
              gap="2"
              className={css`
                color: #66676b;
                justify-content: space-around;
                width: 100%;
              `}
            >
              <VoterDetailColumn
                title={`${pluralizeNoun(nounsRepresented)}`}
                subtitle="represented"
              />
              <VoterDetailColumn
                title={`${votesCast.toString()} props`}
                subtitle="voted on"
              />

              <VoterDetailColumn
                title={`placeholder.eth`}
                subtitle="delegated to them"
              />
            </HStack>
          </HStack>
          <HStack
            gap="2"
            className={css`
              color: #66676b;
              width: 30%;
              justify-content: start;
              padding: ${theme.spacing["2"]};
              @media (max-width: ${theme.maxWidth["4xl"]}) {
                width: 40%;
              }
            `}
          >
            {!!delegate.statement?.summary && (
              <div
                className={css`
                  display: -webkit-box;
                  color: #66676b;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  line-clamp: 2;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  font-size: ${theme.fontSize.sm};
                  line-height: ${theme.lineHeight.snug};
                  @media (max-width: ${theme.maxWidth.md}) {
                    font-size: ${theme.fontSize.sm};
                    line-height: ${theme.lineHeight.tight};
                    line-clamp: 1;
                    -webkit-line-clamp: 1;
                  }
                `}
              >
                {delegate.statement.summary}
              </div>
            )}
          </HStack>
          <HStack
            gap="2"
            className={css`
              color: #66676b;
              width: 20%;
              justify-content: end;
              @media (max-width: ${theme.maxWidth["4xl"]}) {
                width: 60%;
              }
            `}
          >
            <VoterPanelActions
              className={css`
                width: 100%;
                align-items: center;
                justify-content: end;
                gap: ${theme.spacing["3"]};
              `}
              maintainSize
              fragment={delegate}
            />
          </HStack>
        </HStack>
      )}
    </Link>
  );
}

type VoterDetailColumnProps = {
  title: string;
  subtitle: string;
};

function VoterDetailColumn({ title, subtitle }: VoterDetailColumnProps) {
  return (
    <VStack
      gap="0"
      className={css`
        font-size: ${theme.fontSize.sm};
        @media (max-width: ${theme.maxWidth.md}) {
          font-size: ${theme.fontSize.xs};
          max-width: ${theme.spacing["12"]};
        }
      `}
    >
      <p
        className={css`
          font-weight: ${theme.fontWeight.bold};
          color: ${theme.colors.black};
          display: -webkit-box;
          overflow: hidden;
          text-overflow: ellipsis;
          line-clamp: 1;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        `}
      >
        {title}
      </p>
      <p
        className={css`
          display: -webkit-box;
          overflow: hidden;
          text-overflow: ellipsis;
          line-clamp: 1;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        `}
      >
        {subtitle}
      </p>
    </VStack>
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
  flat,
}: {
  fragment: VoterCardDelegateProfileImage$key;
  dense?: boolean;
  flat?: boolean;
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
  ) : flat ? (
    <NounsRepresentedGrid
      normalized
      rows={1}
      columns={dense ? 4 : 6}
      gap={dense ? "0" : "2"}
      imageSize={dense ? "8" : "12"}
      overflowFontSize="base"
      fragmentKey={delegate.delegate}
    />
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
