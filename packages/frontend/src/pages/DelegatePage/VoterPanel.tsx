import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { intersection } from "../../utils/set";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import {
  NounGridChildren,
  NounsRepresentedGrid,
} from "../../components/NounGrid";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { VoterPanelDelegateFragment$key } from "./__generated__/VoterPanelDelegateFragment.graphql";
import { VoterPanelQueryFragment$key } from "./__generated__/VoterPanelQueryFragment.graphql";
import { icons } from "../../icons/icons";
import { buttonStyles } from "../EditDelegatePage/EditDelegatePage";
import { NounResolvedLinkFragment$key } from "../../components/__generated__/NounResolvedLinkFragment.graphql";
import { HStack, VStack } from "../../components/VStack";

type Props = {
  delegateFragment: VoterPanelDelegateFragment$key;
  queryFragment: VoterPanelQueryFragment$key;
};

export function VoterPanel({ delegateFragment, queryFragment }: Props) {
  const address = useFragment(
    graphql`
      fragment VoterPanelDelegateFragment on Address {
        resolvedName {
          ...NounResolvedLinkFragment
        }

        wrappedDelegate {
          statement {
            twitter
          }

          delegate {
            id

            ...NounGridFragment
            nounsRepresented {
              owner {
                id
              }
            }

            tokenHoldersRepresented {
              id

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

  const { recentProposals, metrics } = useFragment(
    graphql`
      fragment VoterPanelQueryFragment on Query {
        recentProposals: proposals(
          orderBy: createdBlock
          orderDirection: desc
          first: 10
        ) {
          id
        }

        metrics {
          totalSupply
          proposalCount
          quorumVotes
        }
      }
    `,
    queryFragment
  );

  if (!delegate) {
    return <EmptyVoterPanel resolvedName={address.resolvedName} />;
  }

  const statement = address.wrappedDelegate.statement;

  const lastTenProposals = new Set(
    recentProposals.slice(0, 10).map((proposal) => proposal.id)
  );
  const votedProposals = new Set(
    delegate.votes.map((vote) => vote.proposal.id)
  );

  const recentParticipation = intersection(lastTenProposals, votedProposals);

  const tokenHolders = delegate.tokenHoldersRepresented.filter(
    (holder) => !!holder.nouns.length
  );

  return (
    <div className={containerStyles}>
      <div
        className={css`
          padding: ${theme.spacing["4"]};
          border-bottom: ${theme.spacing.px} solid ${theme.colors.gray["300"]};
        `}
      >
        <NounsRepresentedGrid fragmentKey={delegate} />
      </div>

      <div
        className={css`
          ${voterPanelDetailsContainerStyle};
        `}
      >
        <NameSection
          resolvedName={address.resolvedName}
          votes={delegate.nounsRepresented.length}
        />

        <div className={panelRowContainerStyles}>
          <PanelRow
            title="Proposals voted"
            detail={`${delegate.votes.length} (${(
              (delegate.votes.length / Number(metrics.proposalCount)) *
              100
            ).toFixed(0)}%)`}
          />

          <PanelRow
            title="Voting power"
            detail={`${(
              (delegate.nounsRepresented.length / Number(metrics.totalSupply)) *
              100
            ).toFixed(0)}% all / ${(
              (delegate.nounsRepresented.length / Number(metrics.quorumVotes)) *
              100
            ).toFixed(0)}% quorum`}
          />

          <PanelRow
            title="Recent activity"
            detail={`${recentParticipation.size} of ${lastTenProposals.size} last props`}
          />

          <PanelRow
            title="Proposals created"
            detail={`${delegate.proposals.length}`}
          />

          <PanelRow
            title="Delegated from"
            detail={`${tokenHolders.length} addresses`}
          />

          <>
            {tokenHolders.map((holder) => (
              <HStack justifyContent="space-between">
                <div
                  className={css`
                    text-overflow: ellipsis;
                    overflow: hidden;
                  `}
                >
                  <NounResolvedLink
                    resolvedName={holder.address.resolvedName}
                  />
                </div>

                <HStack gap="1">
                  <NounGridChildren
                    count={3}
                    nouns={holder.nouns}
                    overflowFontSize="xs"
                    imageSize="6"
                  />
                </HStack>
              </HStack>
            ))}
          </>
        </div>

        <HStack
          justifyContent="space-between"
          alignItems="center"
          className={css`
            margin-top: ${theme.spacing["8"]};
          `}
        >
          <HStack
            gap="4"
            className={css`
              height: ${theme.spacing["6"]};
            `}
          >
            {statement?.twitter && (
              <a href={`https://twitter.com/${statement?.twitter}`}>
                <img src={icons.twitter} alt="twitter" />
              </a>
            )}
            <a href={`https://discord.com`}>
              <img src={icons.discord} alt="discord" />
            </a>
          </HStack>

          <a href={`https://nouns.wtf/delegate?to=${delegate.id}`}>
            <div
              className={css`
                ${buttonStyles};
                padding: ${theme.spacing["2"]};
              `}
            >
              Delegate
            </div>
          </a>
        </HStack>
      </div>
    </div>
  );
}

const panelRowContainerStyles = css`
  display: flex;
  flex-direction: column;
  margin-top: ${theme.spacing["4"]};
  gap: ${theme.spacing["2"]};
`;

type PanelRowProps = {
  title: string;
  detail: string;
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
  resolvedName: NounResolvedLinkFragment$key;
  votes: number;
};

function NameSection({ resolvedName, votes }: NameSectionProps) {
  return (
    <HStack gap="2" alignItems="baseline">
      <span
        className={css`
          font-size: ${theme.fontSize["xl"]};
          font-weight: bolder;
        `}
      >
        <NounResolvedLink resolvedName={resolvedName} />
      </span>
      <span
        className={css`
          font-size: ${theme.fontSize.base};
        `}
      >
        {votes} votes
      </span>
    </HStack>
  );
}

export const shadow =
  "0px 4px 12px rgba(0, 0, 0, 0.02), 0px 2px 2px rgba(0, 0, 0, 0.03);";

const containerStyles = css`
  position: sticky;
  top: ${theme.spacing["16"]};
  border-radius: ${theme.spacing["3"]};
  border-width: ${theme.spacing.px};
  border-color: ${theme.colors.gray.eb};
  box-shadow: ${shadow};
`;

type EmptyVoterPanelProps = {
  resolvedName: NounResolvedLinkFragment$key;
};

const voterPanelDetailsContainerStyle = css`
  display: flex;
  flex-direction: column;
  padding: ${theme.spacing["6"]} ${theme.spacing["6"]};
`;

export function EmptyVoterPanel({ resolvedName }: EmptyVoterPanelProps) {
  return (
    <VStack
      className={css`
        ${containerStyles};
      `}
    >
      <div
        className={css`
          padding: ${theme.spacing["8"]} ${theme.spacing["10"]};

          border-bottom: 1px solid #ebebeb;
        `}
      >
        <HStack
          gap="2"
          alignItems="center"
          className={css`
            border-radius: ${theme.borderRadius.default};
            border: 1px solid #ebebeb;
            padding: ${theme.spacing["2"]} ${theme.spacing["3"]};
          `}
        >
          <div
            className={css`
              background: #3dbf00;
              border-radius: ${theme.spacing["1"]};
              width: ${theme.spacing["1"]};
              height: ${theme.spacing["1"]};
            `}
          />

          <div
            className={css`
              font-size: ${theme.fontSize.xs};
              white-space: nowrap;
            `}
          >
            Currently seeking delegation
          </div>
        </HStack>
      </div>

      <div
        className={css`
          ${voterPanelDetailsContainerStyle};
        `}
      >
        <NameSection resolvedName={resolvedName} votes={0} />

        <div className={panelRowContainerStyles}>
          <PanelRow title="Proposals voted" detail={`N/A`} />

          <PanelRow title="Voting power" detail={`N/A`} />

          <PanelRow title="Recent activity" detail={`N/A`} />

          <PanelRow title="Proposals created" detail={`N/A`} />

          <PanelRow title="Delegated from" detail={`N/A`} />
        </div>
      </div>
    </VStack>
  );
}

export function LoadingVoterPanel() {
  return (
    <div
      className={css`
        padding: ${theme.spacing["8"]} ${theme.spacing["10"]};
        ${containerStyles};
      `}
    >
      Loading...
    </div>
  );
}
