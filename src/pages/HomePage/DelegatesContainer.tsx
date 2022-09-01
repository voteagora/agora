import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCard } from "./VoterCard";
import { DelegatesContainerFragment$key } from "./__generated__/DelegatesContainerFragment.graphql";

type Props = {
  fragmentKey: DelegatesContainerFragment$key;
};

export function DelegatesContainer({ fragmentKey }: Props) {
  const { voters } = useFragment(
    graphql`
      fragment DelegatesContainerFragment on Query {
        voters: delegates(
          first: 1000
          where: { tokenHoldersRepresentedAmount_gt: 0, delegatedVotes_gt: 0 }
          orderBy: delegatedVotes
          orderDirection: desc
        ) {
          id
          delegatedVotes
          tokenHoldersRepresentedAmount

          ...VoterCardFragment
        }
      }
    `,
    fragmentKey
  );

  // todo: move
  if (!voters) {
    return null;
  }

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;

        background-image: radial-gradient(
          rgba(0, 0, 0, 10%) 1px,
          transparent 0
        );
        background-size: 20px 20px;
        width: 100%;
        padding-top: ${theme.spacing["16"]};
        padding-bottom: ${theme.spacing["16"]};
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          max-width: ${theme.maxWidth["6xl"]};
          width: 100%;
          margin-bottom: ${theme.spacing["8"]};
        `}
      >
        <h2
          className={css`
            font-size: ${theme.fontSize["2xl"]};
            font-weight: bolder;
          `}
        >
          Voters
        </h2>
      </div>

      <div
        className={css`
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: ${theme.spacing["8"]};
        `}
      >
        {voters.map((voter) => (
          <VoterCard fragmentRef={voter} />
        ))}
      </div>
    </div>
  );
}
