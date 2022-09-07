import { usePaginationFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCard } from "./VoterCard";
import { DelegatesContainerFragment$key } from "./__generated__/DelegatesContainerFragment.graphql";
import { HStack, VStack } from "../../components/VStack";
import { useCallback, useState, useTransition } from "react";
import {
  WrappedDelegatesOrder,
  WrappedDelegatesWhere,
} from "./__generated__/DelegatesContainerPaginationQuery.graphql";
import { Selector, SelectorItem } from "./Selector";
import { motion } from "framer-motion";
import InfiniteScroll from "react-infinite-scroller";

type Props = {
  fragmentKey: DelegatesContainerFragment$key;
};

const orderNames: { [K in WrappedDelegatesOrder]?: string } = {
  mostNounsRepresented: "Most nouns represented",
  mostRecentlyActive: "Most recently active",
};

export function DelegatesContainer({ fragmentKey }: Props) {
  const [orderBy, setOrderBy] = useState<WrappedDelegatesOrder>(
    "mostNounsRepresented"
  );

  const [filterBy, setFilterBy] = useState<WrappedDelegatesWhere | null>(null);

  const [isPending, startTransition] = useTransition();

  const {
    data: { voters },
    loadNext,
    hasNext,
    isLoadingNext,
    refetch,
  } = usePaginationFragment(
    graphql`
      fragment DelegatesContainerFragment on Query
      @argumentDefinitions(
        first: { type: "Int", defaultValue: 30 }
        after: { type: "String" }
        orderBy: {
          type: "WrappedDelegatesOrder"
          defaultValue: mostNounsRepresented
        }
        filterBy: { type: "WrappedDelegatesWhere" }
      )
      @refetchable(queryName: "DelegatesContainerPaginationQuery") {
        voters: wrappedDelegates(
          first: $first
          after: $after
          orderBy: $orderBy
          where: $filterBy
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
    <VStack
      alignItems="center"
      className={css`
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
        <HStack alignItems="baseline" gap="2" justifyContent="space-between">
          <h2
            className={css`
              font-size: ${theme.fontSize["2xl"]};
              font-weight: bolder;
            `}
          >
            Voters
          </h2>

          <HStack gap="4">
            <Selector
              items={
                [
                  {
                    title: "View all",
                    value: null,
                  },
                  {
                    title: "View with statement",
                    value: "withStatement" as const,
                  },
                  {
                    title: "View seeking delegation",
                    value: "seekingDelegation" as const,
                  },
                ] as SelectorItem<WrappedDelegatesWhere | null>[]
              }
              value={filterBy}
              onChange={(filterBy) => {
                setFilterBy(filterBy);
                startTransition(() => {
                  refetch({ filterBy, orderBy });
                });
              }}
            />

            <Selector
              items={Object.entries(orderNames).map(
                ([value, title]): SelectorItem<WrappedDelegatesOrder> => ({
                  title,
                  value: value as WrappedDelegatesOrder,
                })
              )}
              value={orderBy}
              onChange={(orderBy) => {
                setOrderBy(orderBy);
                startTransition(() => {
                  refetch({ filterBy, orderBy });
                });
              }}
            />
          </HStack>
        </HStack>
      </VStack>

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
              justify-content: space-between;
              grid-template-columns: repeat(auto-fit, 23rem);
              gap: ${theme.spacing["8"]};

              @media (max-width: ${theme.maxWidth["6xl"]}) {
                justify-content: space-around;
              }
            `}
          >
            {voters.edges.map(({ node: voter }) => (
              <VoterCard key={voter.id} fragmentRef={voter} />
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
    </VStack>
  );
}
