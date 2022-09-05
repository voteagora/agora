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
        voters: wrappedDelegates {
          id
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
        max-width: ${theme.maxWidth["6xl"]};
        padding-top: ${theme.spacing["16"]};
        padding-bottom: ${theme.spacing["16"]};
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
      `}
    >
      <VStack
        className={css`
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
          grid-template-columns: repeat(3, calc(${theme.spacing["12"]} * 6));
          gap: ${theme.spacing["8"]};
          max-width: ${theme.maxWidth["6xl"]};
        `}
      >
        {voters.map((voter) => (
          <VoterCard key={voter.id} fragmentRef={voter} />
        ))}
      </div>
    </VStack>
  );
}
