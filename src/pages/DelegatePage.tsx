import { useParams } from "react-router-dom";
import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { DelegatePageQuery } from "./__generated__/DelegatePageQuery.graphql";
import { NounImage } from "../components/NounImage";
import { css } from "@emotion/css";
import * as theme from "../theme";
import { shortAddress } from "../utils/address";
import { countUnique } from "../utils/countUnique";
import { intersection } from "../utils/set";
import { useFragment } from "react-relay";
import { DelegatePageNounGridFragment$key } from "./__generated__/DelegatePageNounGridFragment.graphql";
import { NounResolvedName } from "../components/NounResolvedName";

export function DelegatePage() {
  const { delegateId } = useParams();

  const { delegate, proposals, nouns } = useLazyLoadQuery<DelegatePageQuery>(
    graphql`
      query DelegatePageQuery($id: ID!) {
        delegate(id: $id) {
          id

          ...DelegatePageNounGridFragment
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
            }
          }
        }

        proposals(orderBy: createdBlock, orderDirection: desc) {
          id
        }

        nouns {
          id
        }
      }
    `,
    {
      id: delegateId ?? "",
    }
  );

  if (!delegate) {
    // todo: redirect
    return null;
  }

  if (!proposals) {
    return null;
  }

  if (!nouns) {
    return null;
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
        <DelegateNounGrid fragmentKey={delegate} />
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
          {proposals.length}
        </div>

        <div>
          {delegate.nounsRepresented.length} / {nouns.length}
        </div>

        <div>{recentParticipation.size} / 10</div>

        <div>{owners.length} owners</div>

        <div>
          {owners.map((owner) => (
            <div key={owner}>{shortAddress(owner)}</div>
          ))}
        </div>

        {delegate.votes.map((vote) => (
          <div>{vote.reason}</div>
        ))}
      </div>
    </div>
  );
}

type DelegateNounGridProps = {
  fragmentKey: DelegatePageNounGridFragment$key;
};

function DelegateNounGrid({ fragmentKey }: DelegateNounGridProps) {
  const { nounsRepresented } = useFragment<DelegatePageNounGridFragment$key>(
    graphql`
      fragment DelegatePageNounGridFragment on Delegate {
        nounsRepresented {
          id
          ...NounImageFragment
        }
      }
    `,
    fragmentKey
  );

  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: repeat(5, ${theme.spacing["8"]});
        grid-template-rows: repeat(3, ${theme.spacing["8"]});
        gap: ${theme.spacing["1"]};
        padding: ${theme.spacing["2"]};
      `}
    >
      {nounsRepresented.map((noun) => (
        <NounImage
          className={css`
            border-radius: 50%;
            width: ${theme.spacing["8"]};
            height: ${theme.spacing["8"]};
          `}
          key={noun.id}
          fragmentRef={noun}
        />
      ))}
    </div>
  );
}
