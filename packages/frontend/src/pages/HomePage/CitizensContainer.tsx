import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCard } from "./VoterCard";
import { motion } from "framer-motion";
import { CitizensContainerFragment$key } from "./__generated__/CitizensContainerFragment.graphql";

type Props = {
  fragmentKey: CitizensContainerFragment$key;
};
export function CitizensContainer({ fragmentKey }: Props) {
  const {
    retroPGF: { voters },
  } = useFragment(
    graphql`
      fragment CitizensContainerFragment on Query
      @argumentDefinitions(
        orderBy: { type: "CitizensOrder", defaultValue: mostVotingPower }
      ) {
        retroPGF {
          voters: badgeholders(orderBy: $orderBy) {
            id
            ...VoterCardFragment
          }
        }
      }
    `,
    fragmentKey
  );

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0 }}
      className={css`
        width: 100%;
        /* max-width: ${theme.maxWidth["6xl"]}; */
      `}
    >
      <div
        className={css`
          display: grid;
          grid-auto-flow: row;
          justify-content: space-between;
          padding-top: ${theme.spacing["4"]};
          grid-template-columns: repeat(3, 23rem);
          gap: ${theme.spacing["8"]};
          @media (max-width: ${theme.maxWidth["6xl"]}) {
            grid-template-columns: repeat(auto-fit, 23rem);
            justify-content: space-around;
          }
          @media (max-width: ${theme.maxWidth.md}) {
            grid-template-columns: 1fr;
            gap: ${theme.spacing["4"]};
          }
        `}
      >
        {voters.map((voter) => (
          <VoterCard key={voter.id} fragmentRef={voter} />
        ))}
      </div>
    </motion.div>
  );
}
