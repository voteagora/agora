import { usePaginationFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCard } from "./VoterCard";
import { VoterTabular } from "./VoterTabular";
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
import {
  useLocation,
  useNavigate,
} from "../../components/HammockRouter/HammockRouter";
import { locationToVariables } from "./HomePage";
import { Tab } from "@headlessui/react";
import { Bars4Icon, Squares2X2Icon } from "@heroicons/react/20/solid";

type Props = {
  fragmentKey: DelegatesContainerFragment$key;
  variables: ReturnType<typeof locationToVariables>;
};

const layoutModes = ["Card", "Tabular"] as const;
type LayoutModes = typeof layoutModes;
type LayoutMode = LayoutModes[number];

const layoutModeSelectorStyles = css`
  cursor: pointer;
  width: ${theme.spacing["8"]};
  height: ${theme.spacing["8"]};
  padding: ${theme.spacing["1"]};
  color: ${theme.colors.gray["500"]};

  :hover {
    color: ${theme.colors.black};
  }
`;

const layoutModeSelectorSelectedStyles = css`
  color: ${theme.colors.black};
`;

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

  const location = useLocation();
  const locationToLayoutMode =
    layoutModes.find((needle) => needle === location.search["layoutMode"]) ??
    "Card";
  const [layoutMode, setLayoutMode] =
    useState<LayoutMode>(locationToLayoutMode);

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
              ...VoterTabularFragment
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

  const voterClassNames = {
    Card: css`
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
    `,
    Tabular: css`
      display: grid;
      grid-template-columns: 1fr;
      & a:first-child > div {
        border-radius: ${theme.spacing["3"]} ${theme.spacing["3"]} 0 0;
      }
      ${!hasNext &&
      css`
        & a:last-child > div {
          border-radius: 0 0 ${theme.spacing["3"]} ${theme.spacing["3"]};
        }
      `}
      & a:first-child:last-child > div {
        border-radius: ${theme.spacing["3"]} ${theme.spacing["3"]}
          ${theme.spacing["3"]} ${theme.spacing["3"]};
      }
      @media (max-width: ${theme.maxWidth["6xl"]}) {
        grid-template-columns: repeat(auto-fit, 23rem);
        justify-content: space-around;
      }

      @media (max-width: ${theme.maxWidth.md}) {
        grid-template-columns: 1fr;
        gap: ${theme.spacing["4"]};
      }
    `,
  };
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
            gap="2"
          >
            <HStack
              alignItems="center"
              gap="0"
              className={css`
                background: #f7f7f7;
                border-radius: 35px 0 0 35px;
                border: 1px solid ${theme.colors.gray.eb};
                padding: 0 ${theme.spacing["2"]} 0 ${theme.spacing["3"]};
              `}
            >
              <Tab.Group
                selectedIndex={(() => layoutModes.indexOf(layoutMode))()}
                onChange={(i) => {
                  setLayoutMode(layoutModes[i]);
                  startTransition(() => {
                    navigate({
                      search: {
                        layoutMode:
                          layoutModes[i] === "Card" ? null : layoutModes[i],
                      },
                    });
                  });
                }}
              >
                <Tab.List
                  className={css`
                    height: ${theme.spacing["8"]};
                    *:focus {
                      outline: none;
                    }
                  `}
                >
                  <Tab>
                    {({ selected }) => (
                      <Squares2X2Icon
                        className={css`
                          ${layoutModeSelectorStyles}
                          ${selected && layoutModeSelectorSelectedStyles}
                          box-shadow: ${theme.boxShadow.none};
                        `}
                      />
                    )}
                  </Tab>
                  <Tab>
                    {({ selected }) => (
                      <Bars4Icon
                        className={css`
                          ${layoutModeSelectorStyles}
                          ${selected && layoutModeSelectorSelectedStyles}
                        `}
                      />
                    )}
                  </Tab>
                </Tab.List>
              </Tab.Group>
            </HStack>

            <HStack gap="4">
              <Selector
                borderType={"rightOnly"}
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
          <div className={voterClassNames[layoutMode]}>
            {voters.edges.map(({ node: voter }) => {
              switch (layoutMode) {
                case "Card":
                  return <VoterCard key={voter.id} fragmentRef={voter} />;

                case "Tabular":
                  return <VoterTabular key={voter.id} fragmentRef={voter} />;

                default:
                  throw new Error(`unknown layout mode ${layoutMode}`);
              }
            })}
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
