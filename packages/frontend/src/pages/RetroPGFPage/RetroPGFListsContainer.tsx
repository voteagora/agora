import { css } from "@emotion/css";
import { useCallback } from "react";
import { motion } from "framer-motion";
import { HStack } from "../../components/VStack";
import * as theme from "../../theme";
import { usePaginationFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFListRow } from "./RetroPGFListRow";
import { RetroPGFListsContainerFragment$key } from "./__generated__/RetroPGFListsContainerFragment.graphql";
import InfiniteScroll from "react-infinite-scroller";

export const RetroPGFListsContainer = ({
  fragmentKey,
  isPending,
}: {
  fragmentKey: RetroPGFListsContainerFragment$key;
  isPending?: boolean;
}) => {
  const {
    data: {
      retroPGF: { lists },
    },
    loadNext,
    hasNext,
    isLoadingNext,
  } = usePaginationFragment(
    graphql`
      fragment RetroPGFListsContainerFragment on Query
      @argumentDefinitions(
        first: { type: "Int", defaultValue: 5 }
        after: { type: "String" }
        orderBy: { type: "ListOrder", defaultValue: alphabeticalAZ }
        likedBy: { type: "String" }
        category: { type: "[ListCategory!]" }
        seed: { type: "String" }
        search: { type: "String" }
      )
      @refetchable(queryName: "RetroPGFListsContainerPaginationQuery") {
        retroPGF {
          lists(
            first: $first
            after: $after
            orderBy: $orderBy
            seed: $seed
            search: $search
            likedBy: $likedBy
            category: $category
          ) @connection(key: "RetroPGFListsContainerFragment_lists") {
            edges {
              node {
                id
                ...RetroPGFListRowFragment
              }
            }
          }
        }
      }
    `,
    fragmentKey
  );

  const loadMore = useCallback(() => {
    loadNext(5);
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
      {!lists.edges.length ? (
        <HStack justifyContent="center">No lists yet...</HStack>
      ) : (
        <InfiniteScroll loadMore={loadMore} hasMore={hasNext}>
          <div
            className={css`
              box-shadow: ${theme.boxShadow.newDefault};
              border-radius: ${theme.borderRadius.xl};
              border: 1px solid ${theme.colors.gray[300]};
              display: grid;
              grid-template-columns: 1fr;
              background: ${theme.colors.white};

              // todo: this affects more things than affected
              & a:first-child > div {
                border-top: 0px;
              }
            `}
          >
            {lists.edges.map((item) => (
              <RetroPGFListRow key={item.node.id} fragmentRef={item.node} />
            ))}
          </div>
        </InfiniteScroll>
      )}
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
};
