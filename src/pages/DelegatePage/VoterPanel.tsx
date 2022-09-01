import { DelegatePageVoterPanelFragment$key } from "./__generated__/DelegatePageVoterPanelFragment.graphql";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { useNounsCount } from "../../hooks/useNounsCount";
import { useProposalsCount } from "../../hooks/useProposalsCount";
import { useQuorumVotes } from "../../hooks/useQuorumVotes";
import { Navigate } from "react-router-dom";
import { countUnique } from "../../utils/countUnique";
import { intersection } from "../../utils/set";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import {
  NounGridChildren,
  NounsRepresentedGrid,
} from "../../components/NounGrid";
import { NounResolvedLink } from "../../components/NounResolvedLink";

type Props = {
  fragment: DelegatePageVoterPanelFragment$key;
};

export function VoterPanel({ fragment }: Props) {
  const { delegate, proposals } = useFragment(
    graphql`
      fragment DelegatePageVoterPanelFragment on Query
      @argumentDefinitions(id: { type: "ID!" }) {
        delegate(id: $id) {
          id

          ...NounGridFragment
          nounsRepresented {
            owner {
              id
            }
          }

          tokenHoldersRepresented {
            id

            nouns {
              id
              ...NounImageFragment
            }
          }

          votes {
            id
            reason

            proposal {
              id
              description
            }
          }

          proposals {
            id
          }
        }

        proposals(orderBy: createdBlock, orderDirection: desc, first: 10) {
          id
        }
      }
    `,
    fragment
  );

  // todo: there is a waterfall here
  const totalSupply = useNounsCount();
  const proposalsCount = useProposalsCount();
  const quorumVotes = useQuorumVotes();

  if (!delegate || !proposals) {
    return <Navigate to="/" />;
  }

  const lastTenProposals = new Set(
    proposals.slice(0, 10).map((proposal) => proposal.id)
  );
  const votedProposals = new Set(
    delegate.votes.map((vote) => vote.proposal.id)
  );

  const proposalsVoted = countUnique(
    delegate.votes.map((proposal) => proposal.id)
  );

  const recentParticipation = intersection(lastTenProposals, votedProposals);

  const tokenHolders = delegate.tokenHoldersRepresented.filter(
    (holder) => !!holder.nouns.length
  );

  return (
    <div
      className={css`
        border-radius: ${theme.spacing["4"]};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
        box-shadow: ${theme.boxShadow.lg};
      `}
    >
      <div
        className={css`
          padding: ${theme.spacing["4"]};
          padding-bottom: ${theme.spacing["2"]};
          border-bottom: ${theme.spacing.px} solid ${theme.colors.gray["300"]};
        `}
      >
        <NounsRepresentedGrid fragmentKey={delegate} />
      </div>

      <div
        className={css`
          display: flex;
          flex-direction: column;
          padding: ${theme.spacing["6"]};
        `}
      >
        <div
          className={css`
            display: flex;
            flex-direction: row;
            align-items: baseline;
            gap: ${theme.spacing["2"]};
          `}
        >
          <span
            className={css`
              font-size: ${theme.fontSize.lg};
              font-weight: bolder;
            `}
          >
            <NounResolvedLink address={delegate.id} />
          </span>
          <span
            className={css`
              font-size: ${theme.fontSize.base};
            `}
          >
            {delegate.nounsRepresented.length} votes
          </span>
        </div>

        <PanelRow
          title="Proposals voted"
          detail={`${proposalsVoted} (${(
            (proposalsVoted / proposalsCount.toNumber()) *
            100
          ).toFixed(0)}%)`}
        />

        <PanelRow
          title="Voting power"
          detail={`${(
            (delegate.nounsRepresented.length / totalSupply.toNumber()) *
            100
          ).toFixed(0)}% all / ${(
            (delegate.nounsRepresented.length / quorumVotes.toNumber()) *
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
            <div
              className={css`
                display: flex;
                flex-direction: row;
                justify-content: space-between;
              `}
            >
              <div
                className={css`
                  text-overflow: ellipsis;
                  overflow: hidden;
                `}
              >
                <NounResolvedLink address={holder.id} />
              </div>

              <div
                className={css`
                  display: flex;
                  flex-direction: row;
                  gap: ${theme.spacing["1"]};
                `}
              >
                <NounGridChildren
                  count={3}
                  nouns={holder.nouns}
                  overflowFontSize="xs"
                  imageSize="6"
                />
              </div>
            </div>
          ))}
        </>
      </div>
    </div>
  );
}

type PanelRowProps = {
  title: string;
  detail: string;
};

const PanelRow = ({ title, detail }: PanelRowProps) => {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      `}
    >
      <span>{title}</span>

      <span
        className={css`
          font-size: ${theme.fontSize.sm};
        `}
      >
        {detail}
      </span>
    </div>
  );
};
