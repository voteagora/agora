import { Navigate, useParams } from "react-router-dom";
import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { DelegatePageQuery } from "./__generated__/DelegatePageQuery.graphql";
import { css } from "@emotion/css";
import * as theme from "../theme";
import { countUnique } from "../utils/countUnique";
import { intersection } from "../utils/set";
import { NounResolvedName } from "../components/NounResolvedName";
import { fromMarkdown } from "mdast-util-from-markdown";
import { NounGrid } from "../components/NounGrid";
import { useNounsCount } from "../hooks/useNounsCount";
import { useProposalsCount } from "../hooks/useProposalsCount";
import { useQuorumVotes } from "../hooks/useQuorumVotes";

export function DelegatePage() {
  const { delegateId } = useParams();

  const { delegate, proposals } = useLazyLoadQuery<DelegatePageQuery>(
    graphql`
      query DelegatePageQuery($id: ID!) {
        delegate(id: $id) {
          id

          ...NounGridFragment
          nounsRepresented {
            owner {
              id
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
        }

        proposals(orderBy: createdBlock, orderDirection: desc, first: 10) {
          id
        }
      }
    `,
    {
      id: delegateId ?? "",
    }
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
  const recentParticipation = intersection(lastTenProposals, votedProposals);

  const owners = Array.from(
    new Set(delegate.nounsRepresented.map((noun) => noun.owner.id))
  );

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        border-radius: ${theme.borderRadius.default};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
      `}
    >
      <div
        className={css`
          border-bottom-width: ${theme.spacing.px};
          border-bottom-color: ${theme.colors.gray["300"]};
        `}
      >
        <NounGrid fragmentKey={delegate} />
      </div>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          padding: ${theme.spacing["2"]};
        `}
      >
        <div>
          <NounResolvedName address={delegate.id} />
        </div>
        <div>{delegate.votes.length} votes</div>

        <div>
          {countUnique(delegate.votes.map((proposal) => proposal.id))} /{" "}
          {proposalsCount.toString()}
        </div>

        <div>
          {delegate.nounsRepresented.length} / {totalSupply.toString()}
        </div>

        <div>
          {delegate.nounsRepresented.length} / {quorumVotes.toString()}
        </div>

        <div>{recentParticipation.size} / 10</div>

        <div>{owners.length} owners</div>

        <div>
          {owners.map((owner) => (
            <div key={owner}>
              <NounResolvedName address={owner} />
            </div>
          ))}
        </div>

        {delegate.votes.map((vote) => (
          <div>
            <div>
              #{vote.proposal.id}{" "}
              {getTitleFromProposalDescription(vote.proposal.description)}
            </div>
            <pre>{vote.reason}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function getTitleFromProposalDescription(description: string) {
  const parsed = fromMarkdown(description);
  const firstChild = parsed.children[0];
  if (firstChild.type !== "heading") {
    return null;
  }

  if (firstChild.children.length !== 1) {
    return null;
  }

  const firstTextNode = firstChild.children[0];
  if (firstTextNode.type !== "text") {
    return null;
  }

  return firstTextNode.value;
}
