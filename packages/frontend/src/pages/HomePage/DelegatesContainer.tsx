import { usePaginationFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCard } from "./VoterCard";
import { DelegatesContainerFragment$key } from "./__generated__/DelegatesContainerFragment.graphql";
import { HStack, VStack } from "../../components/VStack";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  WrappedDelegatesOrder,
  WrappedDelegatesWhere,
} from "./__generated__/DelegatesContainerPaginationQuery.graphql";
import { Selector, SelectorItem, SelectorRadius } from "./Selector";
import {
  InlineSelector,
  InlineSelectorItem,
  InlineSelectorRadius,
} from "./InlineSelector";
import { motion } from "framer-motion";
import InfiniteScroll from "react-infinite-scroller";
import { useNavigate } from "../../components/HammockRouter/HammockRouter";
import { locationToVariables } from "./HomePage";
import { Bars4Icon, Squares2X2Icon } from "@heroicons/react/20/solid";

type Props = {
  fragmentKey: DelegatesContainerFragment$key;
  variables: ReturnType<typeof locationToVariables>;
};

const orderNames: { [K in WrappedDelegatesOrder]?: string } = {
  mostRelevant: "Most relevant",
  mostNounsRepresented: "Most nouns represented",
  mostRecentlyActive: "Most recently active",
  mostVotesCast: "Most votes cast",
  leastVotesCast: "Least votes cast",
};

export function DelegatesContainer({ fragmentKey, variables }: Props) {
  const [isPending, startTransition] = useTransition();
  const [localOrderBy, setLocalOrderBy] = useState<WrappedDelegatesOrder>(
    variables.orderBy
  );

  const [localFilterBy, setLocalFilterBy] =
    useState<WrappedDelegatesWhere | null>(variables.filterBy);
  const [isGrid, setIsGrid] = useState(true);
  const [layoutCss, setLayoutCss] = useState<string>();
  useEffect(() => {
    if (isGrid) {
      setLayoutCss(css`
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
      `);
    } else {
      setLayoutCss(css`
        display: grid;
        grid-auto-flow: row;
        grid-template-columns: 1fr;
      `);
    }
  }, [isGrid]);

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
        orderBy: { type: "WrappedDelegatesOrder", defaultValue: mostRelevant }
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
            <HStack
              gap="1"
              className={css`
                @media (max-width: ${theme.maxWidth.lg}) {
                  flex-direction: column;
                  align-items: stretch;
                }
              `}
            >
              <InlineSelector
                selectorRadius={InlineSelectorRadius.Left}
                initValue="grid"
                items={
                  [
                    {
                      icon: (
                        <Squares2X2Icon
                          className={css`
                            width: ${theme.spacing["4"]};
                            height: ${theme.spacing["4"]};
                          `}
                        />
                      ),
                      title: "grid",
                      value: "grid",
                    },
                    {
                      icon: (
                        <Bars4Icon
                          className={css`
                            width: ${theme.spacing["4"]};
                            height: ${theme.spacing["4"]};
                          `}
                        />
                      ),
                      title: "list",
                      value: "list",
                    },
                  ] as InlineSelectorItem<string | null>[]
                }
                onChange={(value) => {
                  setIsGrid(value === "grid");
                }}
              />

              <Selector
                selectorRadius={SelectorRadius.Right}
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
                value={isPending ? localFilterBy : variables.filterBy}
                onChange={(filterBy) => {
                  setLocalFilterBy(filterBy);
                  startTransition(() => {
                    navigate({ search: { filterBy: filterBy ?? null } });
                  });
                }}
              />
            </HStack>

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
                        orderBy === "mostRelevant" ? null : orderBy ?? null,
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
          <div className={layoutCss}>
            {voters.edges.map(({ node: voter }) => (
              <VoterCard key={voter.id} isGrid={isGrid} fragmentRef={voter} />
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
