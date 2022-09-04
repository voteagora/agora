import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCard } from "./VoterCard";
import { DelegatesContainerFragment$key } from "./__generated__/DelegatesContainerFragment.graphql";
import { VStack } from "../../components/VStack";

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

  return (
    <VStack
      alignItems="center"
      className={css`
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
      <VStack
        className={css`
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
      </VStack>

      <div
        className={css`
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: ${theme.spacing["8"]};
        `}
      >
        {voters.map((voter) => (
          <VoterCard key={voter.id} fragmentRef={voter} />
        ))}
      </div>
    </VStack>
  );
}
