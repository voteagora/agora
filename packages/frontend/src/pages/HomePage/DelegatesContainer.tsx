import { usePaginationFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCard } from "./VoterCard";
import { DelegatesContainerFragment$key } from "./__generated__/DelegatesContainerFragment.graphql";
import { HStack } from "../../components/VStack";
import { useCallback } from "react";
import { motion } from "framer-motion";
import InfiniteScroll from "react-infinite-scroller";

type Props = {
  fragmentKey: DelegatesContainerFragment$key;
  isPending?: boolean;
};

export function DelegatesContainer({ fragmentKey, isPending }: Props) {
  const {
    data: { voters },
    loadNext,
    hasNext,
    isLoadingNext,
  } = usePaginationFragment(
    graphql`
      fragment DelegatesContainerFragment on Query
      @argumentDefinitions(
        first: { type: "Int", defaultValue: 30 }
        after: { type: "String" }
        orderBy: { type: "DelegatesOrder", defaultValue: weightedRandom }
        seed: { type: "String" }
      )
      @refetchable(queryName: "DelegatesContainerPaginationQuery") {
        voters: delegates(
          first: $first
          after: $after
          orderBy: $orderBy
          seed: $seed
        ) @connection(key: "DelegatesContainerFragment_voters") {
          edges {
            node {
              id
              ...VoterCardFragment
            }
          }
        }
      }
    `,
    fragmentKey
  );

  const loadMore = useCallback(() => {
    loadNext(30);
  }, [loadNext]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isPending ? 0.3 : 1 }}
      transition={{ duration: 0.3, delay: isPending ? 0.3 : 0 }}
      className={css`
        width: 100%;
        /* max-width: ${theme.maxWidth["6xl"]}; */
      `}
    >
      <InfiniteScroll loadMore={loadMore} hasMore={hasNext}>
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
          {voters.edges.map((voter) => (
            <VoterCard key={voter.node.id} fragmentRef={voter.node} />
          ))}
        </div>
      </InfiniteScroll>

      {isLoadingNext && (
        <HStack
          justifyContent="center"
          className={css`
            padding-top: ${theme.spacing["16"]};
          `}
        >
          Loading...
        </HStack>
      )}
    </motion.div>
  );
}
