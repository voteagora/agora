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
import { useNavigate } from "../../components/HammockRouter/HammockRouter";
import { locationToVariables } from "./HomePage";

type Props = {
  fragmentKey: DelegatesContainerFragment$key;
  variables: ReturnType<typeof locationToVariables>;
};

const orderNames: { [K in WrappedDelegatesOrder]?: string } = {
  mostVotingPower: "Most voting power",
  mostDelegates: "Most delegates",
};

const filterNames = [
  {
    title: "View all",
    value: null,
  },
  {
    title: "View with statement",
    value: "withStatement" as const,
  },
  {
    title: "View without statement",
    value: "withoutStatement" as const,
  },
];

export function parseOrderName(
  orderName: string
): WrappedDelegatesOrder | null {
  if (orderName in orderNames) {
    return orderName as any;
  }

  return null;
}

export function parseFilterName(
  filterName: string
): WrappedDelegatesWhere | null {
  return (
    filterNames.find((filter) => filter.value === filterName)?.value ?? null
  );
}

export function DelegatesContainer({ fragmentKey, variables }: Props) {
  const [isPending, startTransition] = useTransition();
  const [localOrderBy, setLocalOrderBy] = useState<WrappedDelegatesOrder>(
    variables.orderBy
  );

  const [localFilterBy, setLocalFilterBy] =
    useState<WrappedDelegatesWhere | null>(variables.filterBy);

  const navigate = useNavigate();

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
        orderBy: {
          type: "WrappedDelegatesOrder"
          defaultValue: mostVotingPower
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
        <HStack
          alignItems="baseline"
          gap="2"
          justifyContent="space-between"
          className={css`
            @media (max-width: ${theme.maxWidth.lg}) {
              flex-direction: column;
              align-items: stretch;
            }
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

          <HStack
            gap="4"
            className={css`
              @media (max-width: ${theme.maxWidth.lg}) {
                flex-direction: column;
                align-items: stretch;
              }
            `}
          >
            <Selector
              items={
                filterNames as SelectorItem<WrappedDelegatesWhere | null>[]
              }
              value={isPending ? localFilterBy : variables.filterBy}
              onChange={(filterBy) => {
                setLocalFilterBy(filterBy);
                startTransition(() => {
                  navigate({ search: { filterBy: filterBy ?? null } });
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
              value={isPending ? localOrderBy : variables.orderBy}
              onChange={(orderBy) => {
                setLocalOrderBy(orderBy);
                startTransition(() => {
                  navigate({
                    search: {
                      orderBy:
                        orderBy === "mostVotingPower" ? null : orderBy ?? null,
                    },
                  });
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
              grid-auto-flow: row;
              justify-content: space-between;
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
