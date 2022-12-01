import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { intersection } from "../../utils/set";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { NounGridChildren } from "../../components/NounGrid";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { VoterPanelDelegateFragment$key } from "./__generated__/VoterPanelDelegateFragment.graphql";
import { VoterPanelQueryFragment$key } from "./__generated__/VoterPanelQueryFragment.graphql";
import { icons } from "../../icons/icons";
import { buttonStyles } from "../EditDelegatePage/EditDelegatePage";
import { HStack, VStack } from "../../components/VStack";
import { VoterPanelDelegateButtonFragment$key } from "./__generated__/VoterPanelDelegateButtonFragment.graphql";
import { VoterPanelActionsFragment$key } from "./__generated__/VoterPanelActionsFragment.graphql";
import { ReactNode, useMemo, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { VoterPanelDelegateFromListFragment$key } from "./__generated__/VoterPanelDelegateFromListFragment.graphql";
import { VoterPanelNameSectionFragment$key } from "./__generated__/VoterPanelNameSectionFragment.graphql";
import { shortAddress } from "../../utils/address";
import { Textfit } from "react-textfit";
import { useStartTransition } from "../../components/HammockRouter/HammockRouter";
import toast from "react-hot-toast";
import { DelegateProfileImage } from "../HomePage/VoterCard";
import { BigNumber } from "ethers";
import { pluralizeAddresses, pluralizeNoun } from "../../words";
import { useOpenDialog } from "../../components/DialogProvider/DialogProvider";

type Props = {
  delegateFragment: VoterPanelDelegateFragment$key;
  queryFragment: VoterPanelQueryFragment$key;
};

export function VoterPanel({ delegateFragment, queryFragment }: Props) {
  const address = useFragment(
    graphql`
      fragment VoterPanelDelegateFragment on Address {
        resolvedName {
          ...VoterPanelNameSectionFragment
        }

        wrappedDelegate {
          ...VoterCardDelegateProfileImage
          ...VoterPanelActionsFragment

          delegate {
            id

            delegatedVotes
            ...VoterPanelDelegateFromListFragment

            voteSummary {
              forVotes
              againstVotes
              abstainVotes
            }

            votes(orderBy: blockNumber, orderDirection: desc) {
              id

              proposal {
                id
              }
            }

            proposals {
              id
            }
          }
        }
      }
    `,
    delegateFragment
  );

  const delegate = address.wrappedDelegate.delegate;

  const { recentProposals, metrics, currentGovernance } = useFragment(
    graphql`
      fragment VoterPanelQueryFragment on Query {
        recentProposals: proposals(
          orderBy: createdBlock
          orderDirection: desc
          first: 10
          where: { status_not_in: [CANCELLED, VETOED, PENDING] }
        ) {
          id
        }

        currentGovernance {
          proposals
          delegatedVotes
        }

        metrics {
          quorumVotesBPS
        }
      }
    `,
    queryFragment
  );

  const quorumVotes = BigNumber.from(metrics.quorumVotesBPS)
    .mul(currentGovernance.delegatedVotes)
    .div(100 * 100);

  return (
    <VStack
      className={css`
        background-color: ${theme.colors.white};
        border-radius: ${theme.spacing["3"]};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
        box-shadow: ${theme.boxShadow.newDefault};
      `}
    >
      <VStack
        alignItems="center"
        className={css`
          padding: ${theme.spacing["4"]};
          border-bottom: ${theme.spacing.px} solid ${theme.colors.gray["300"]};
        `}
      >
        <DelegateProfileImage fragment={address.wrappedDelegate} dense />
      </VStack>

      <div
        className={css`
          ${css`
            display: flex;
            flex-direction: column;
            padding: ${theme.spacing["6"]} ${theme.spacing["6"]};
          `};
        `}
      >
        <NameSection resolvedName={address.resolvedName} />

        <div className={panelRowContainerStyles}>
          <PanelRow
            title={"Nouns represented"}
            detail={
              !delegate
                ? "N/A"
                : pluralizeNoun(BigNumber.from(delegate.delegatedVotes))
            }
          />

          <PanelRow
            title="Proposals voted"
            detail={
              !delegate
                ? "N/A"
                : `${delegate.votes.length} (${(
                    (delegate.votes.length /
                      Number(currentGovernance.proposals)) *
                    100
                  ).toFixed(0)}%)`
            }
          />

          <PanelRow
            title="Voting power"
            detail={
              !delegate
                ? "N/A"
                : `${(
                    (Number(delegate.delegatedVotes) /
                      Number(currentGovernance.delegatedVotes)) *
                    100
                  ).toFixed(0)}% all / ${(
                    (Number(delegate.delegatedVotes) / Number(quorumVotes)) *
                    100
                  ).toFixed(0)}% quorum`
            }
          />

          <PanelRow
            title="For / Against / Abstain"
            detail={(() => {
              if (!delegate) {
                return "N/A";
              }

              return `${delegate.voteSummary.forVotes} / ${delegate.voteSummary.againstVotes} / ${delegate.voteSummary.abstainVotes}`;
            })()}
          />

          {(() => {
            if (!delegate) {
              return <PanelRow title="Recent activity" detail={`N/A`} />;
            }

            const lastTenProposals = new Set(
              recentProposals.slice(0, 10).map((proposal) => proposal.id)
            );

            const votedProposals = new Set(
              delegate.votes.map((vote) => vote.proposal.id)
            );

            const recentParticipation = intersection(
              lastTenProposals,
              votedProposals
            );

            return (
              <PanelRow
                title="Recent activity"
                detail={`${recentParticipation.size} of ${lastTenProposals.size} last props`}
              />
            );
          })()}

          <PanelRow
            title="Proposals created"
            detail={`${delegate?.proposals?.length ?? "N/A"}`}
          />

          {delegate && <DelegateFromList fragment={delegate} />}

          <VoterPanelActions
            className={css`
              margin-top: ${theme.spacing["6"]};
            `}
            fragment={address.wrappedDelegate}
          />
        </div>
      </div>
    </VStack>
  );
}

function DelegateFromList({
  fragment,
}: {
  fragment: VoterPanelDelegateFromListFragment$key;
}) {
  const { tokenHoldersRepresented } = useFragment(
    graphql`
      fragment VoterPanelDelegateFromListFragment on Delegate {
        tokenHoldersRepresented {
          id
          tokenBalance

          address {
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }

          nouns {
            id
            ...NounImageFragment
          }
        }
      }
    `,
    fragment
  );

  const tokenHolders = useMemo(() => {
    return tokenHoldersRepresented
      .filter((holder) => !!holder.nouns.length)
      .slice()
      .sort(descendingValueComparator((item) => item.nouns.length));
  }, [tokenHoldersRepresented]);

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <VStack gap="1">
      <PanelRow
        title="Delegated from"
        detail={
          <div onClick={() => setIsExpanded((lastValue) => !lastValue)}>
            <HStack
              alignItems="center"
              gap="1"
              className={css`
                cursor: pointer;
                user-select: none;
              `}
            >
              <div>{pluralizeAddresses(tokenHolders.length)}</div>
              <ChevronDownIcon
                aria-hidden="true"
                className={css`
                  margin-bottom: -0.125rem;
                  transition: transform 0.3s;
                  width: ${theme.spacing["4"]};
                  height: ${theme.spacing["4"]};
                  ${isExpanded &&
                  css`
                    transform: rotateZ(180deg);
                  `}
                `}
              />
            </HStack>
          </div>
        }
      />

      {isExpanded &&
        tokenHolders.map((holder) => (
          <HStack justifyContent="space-between">
            <div
              className={css`
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
              `}
            >
              <NounResolvedLink resolvedName={holder.address.resolvedName} />
            </div>

            <HStack
              gap="1"
              className={css`
                flex-shrink: 0;
              `}
            >
              <NounGridChildren
                totalNouns={Number(holder.tokenBalance)}
                count={5}
                nouns={holder.nouns}
                overflowFontSize="xs"
                imageSize="6"
              />
            </HStack>
          </HStack>
        ))}
    </VStack>
  );
}

export function VoterPanelActions({
  className,
  fragment,
}: {
  className?: string;
  fragment: VoterPanelActionsFragment$key;
}) {
  const wrappedDelegate = useFragment(
    graphql`
      fragment VoterPanelActionsFragment on WrappedDelegate {
        statement {
          twitter
          discord
        }

        ...VoterPanelDelegateButtonFragment
      }
    `,
    fragment
  );

  const statement = wrappedDelegate.statement;

  return (
    <HStack
      justifyContent="space-between"
      alignItems="stretch"
      className={className}
    >
      {statement && (
        <HStack gap="4" alignItems="center">
          {statement.twitter && (
            <a
              className={css`
                padding: ${theme.spacing["1"]};
              `}
              href={`https://twitter.com/${statement.twitter}`}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={icons.twitter} alt="twitter" />
            </a>
          )}

          {statement.discord && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast("copied discord handle to clipboard");

                navigator.clipboard.writeText(statement.discord);
              }}
            >
              <img src={icons.discord} alt="discord" />
            </button>
          )}
        </HStack>
      )}
      <DelegateButton
        fragment={wrappedDelegate}
        full={!statement || (!statement.twitter && !statement.discord)}
      />
    </HStack>
  );
}

function DelegateButton({
  fragment,
  full,
}: {
  fragment: VoterPanelDelegateButtonFragment$key;
  full: boolean;
}) {
  const wrappedDelegate = useFragment(
    graphql`
      fragment VoterPanelDelegateButtonFragment on WrappedDelegate {
        address {
          resolvedName {
            address
          }
        }
      }
    `,
    fragment
  );

  const startTransition = useStartTransition();
  const openDialog = useOpenDialog();

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          startTransition(() =>
            openDialog({
              type: "DELEGATE",
              params: {
                targetAccountAddress:
                  wrappedDelegate.address.resolvedName.address,
              },
            })
          );
        }}
        className={css`
          ${buttonStyles};
          ${full &&
          css`
            width: 100%;
          `}
        `}
      >
        Delegate
      </button>
    </>
  );
}

const panelRowContainerStyles = css`
  display: flex;
  flex-direction: column;
  margin-top: ${theme.spacing["6"]};
  gap: ${theme.spacing["2"]};
`;

type PanelRowProps = {
  title: string;
  detail: ReactNode;
};

const PanelRow = ({ title, detail }: PanelRowProps) => {
  return (
    <HStack gap="4" justifyContent="space-between">
      <span
        className={css`
          white-space: nowrap;
        `}
      >
        {title}
      </span>

      <span
        className={css`
          font-size: ${theme.fontSize.sm};
          color: #66676b;
          text-align: right;
        `}
      >
        {detail}
      </span>
    </HStack>
  );
};

type NameSectionProps = {
  resolvedName: VoterPanelNameSectionFragment$key;
};

function NameSection({ resolvedName }: NameSectionProps) {
  const { address, name } = useFragment(
    graphql`
      fragment VoterPanelNameSectionFragment on ResolvedName {
        address
        name
      }
    `,
    resolvedName
  );

  const renderedAddress = shortAddress(address);

  return (
    <a href={`https://etherscan.io/address/${address}`}>
      <VStack>
        {name && (
          <div
            className={css`
              color: #66676b;
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.medium};
              line-height: ${theme.lineHeight.relaxed};
            `}
          >
            {renderedAddress}
          </div>
        )}

        <div
          className={css`
            font-weight: ${theme.fontWeight.black};
            font-size: ${theme.fontSize["2xl"]};
            line-height: ${theme.lineHeight.tight};
            overflow: hidden;
          `}
        >
          <Textfit min={16} max={24} mode="single">
            {name ?? renderedAddress}
          </Textfit>
        </div>
      </VStack>
    </a>
  );
}

export const shadow =
  "0px 4px 12px rgba(0, 0, 0, 0.02), 0px 2px 2px rgba(0, 0, 0, 0.03);";

export type Comparator<T> = (a: T, b: T) => number;

export function descendingValueComparator<T>(
  getValueFor: (item: T) => number
): Comparator<T> {
  return (a, b) => {
    const aValue = getValueFor(a);
    const bValue = getValueFor(b);

    return bValue - aValue;
  };
}

export function flipComparator<T>(toFlip: Comparator<T>): Comparator<T> {
  return (a, b) => toFlip(b, a);
}
