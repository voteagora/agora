import { usePaginationFragment } from "react-relay";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCard } from "./VoterCard";
import { DelegatesContainerFragment$key } from "./__generated__/DelegatesContainerFragment.graphql";
import { HStack, VStack } from "../../components/VStack";
import { useCallback, useState, useTransition } from "react";
import {
  DelegatesOrder,
  DelegatesWhere,
} from "./__generated__/DelegatesContainerPaginationQuery.graphql";
import { Selector, SelectorItem } from "./Selector";
import { motion } from "framer-motion";
import { useNavigate } from "../../components/HammockRouter/HammockRouter";
import { locationToVariables } from "./HomePage";
import { ReactWindowScroller } from "react-window-scroller";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";

type Props = {
  fragmentKey: DelegatesContainerFragment$key;
  variables: ReturnType<typeof locationToVariables>;
};

const orderNames: { [K in DelegatesOrder]?: string } = {
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

export function parseOrderName(orderName: string): DelegatesOrder | null {
  if (orderName in orderNames) {
    return orderName as any;
  }

  return null;
}

export function parseFilterName(filterName: string): DelegatesWhere | null {
  return (
    filterNames.find((filter) => filter.value === filterName)?.value ?? null
  );
}

export function DelegatesContainer({ fragmentKey, variables }: Props) {
  const [isPending, startTransition] = useTransition();
  const [localOrderBy, setLocalOrderBy] = useState<DelegatesOrder>(
    variables.orderBy
  );

  const [localFilterBy, setLocalFilterBy] = useState<DelegatesWhere | null>(
    variables.filterBy
  );

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
        orderBy: { type: "DelegatesOrder", defaultValue: mostVotingPower }
        filterBy: { type: "DelegatesWhere" }
      )
      @refetchable(queryName: "DelegatesContainerPaginationQuery") {
        voters: delegates(
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

  const itemsSize = 350;

  const displayedItemsCount = voters.edges.length + (isLoadingNext ? 1 : 0);

  const totalItemsCountWithLoadingBuffer =
    voters.edges.length + (hasNext && !isLoadingNext ? 1 : 0);
  const isItemLoaded = (idx: number) => idx < displayedItemsCount;

  const loadMore = useCallback(
    (startIndex: number, stopIndex: number) => {
      console.log({
        startIndex,
        stopIndex,
        displayedItemsCount,
        totalItemsCountWithLoadingBuffer,
      });
      loadNext(30);
    },
    [loadNext, totalItemsCountWithLoadingBuffer, displayedItemsCount]
  );

  const ListChild = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      if (index >= displayedItemsCount) {
        throw new Error("non-displayable index rendered");
      }

      if (isLoadingNext && index === voters.edges.length) {
        return (
          <HStack
            style={style}
            justifyContent="center"
            className={css`
              padding-top: ${theme.spacing["16"]};
            `}
          >
            Loading...
          </HStack>
        );
      }

      console.log({ len: voters.edges.length, index });
      const voter = voters.edges[index].node;

      return <VoterCard key={voter.id} fragmentRef={voter} style={style} />;
    },
    [voters.edges, displayedItemsCount, isLoadingNext]
  );

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
            @media (max-width: ${theme.maxWidth["2xl"]}) {
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
              @media (max-width: ${theme.maxWidth["2xl"]}) {
                flex-direction: column;
                align-items: stretch;
              }
            `}
          >
            <DelegatePageInput />

            <Selector
              items={filterNames as SelectorItem<DelegatesWhere | null>[]}
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
                ([value, title]): SelectorItem<DelegatesOrder> => ({
                  title,
                  value: value as DelegatesOrder,
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
        `}
      >
        <div
          className={css`
            height: ${displayedItemsCount * itemsSize}px;
          `}
        >
          <InfiniteLoader
            itemCount={totalItemsCountWithLoadingBuffer}
            loadMoreItems={loadMore}
            isItemLoaded={isItemLoaded}
          >
            {({ onItemsRendered }) => (
              <ReactWindowScroller>
                {({ ref, outerRef, onScroll }) => (
                  <FixedSizeList
                    onItemsRendered={onItemsRendered}
                    ref={ref}
                    outerRef={outerRef}
                    onScroll={onScroll}
                    width="100%"
                    height={window.innerHeight}
                    itemCount={displayedItemsCount}
                    itemSize={itemsSize}
                  >
                    {/*todo: mixed height flowing into */}
                    {ListChild}
                  </FixedSizeList>
                )}
              </ReactWindowScroller>
            )}
          </InfiniteLoader>
        </div>
      </motion.div>
    </VStack>
  );
}

const DelegatePageInput = () => {
  const [enteredName, setEnteredName] = useState("");
  const navigate = useNavigate();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ path: `/delegate/${enteredName}` });
      }}
    >
      <VStack
        className={css`
          position: relative;
        `}
      >
        <VStack
          justifyContent="center"
          className={css`
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;

            padding: ${theme.spacing["2"]};
          `}
        >
          <MagnifyingGlassIcon
            className={css`
              color: #4f4f4f;
              width: ${theme.spacing["4"]};
              height: ${theme.spacing["4"]};
            `}
          />
        </VStack>

        <input
          type="text"
          onChange={(event) => setEnteredName(event.target.value)}
          placeholder="Enter ENS or address"
          className={css`
            padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
            padding-left: ${theme.spacing["8"]};
            border-radius: ${theme.borderRadius.full};
            background: #fafafa;
            border-color: #ebebeb;
            border-width: 1px;

            &::placeholder {
              color: #afafaf;
            }
          `}
        />
      </VStack>
    </form>
  );
};
