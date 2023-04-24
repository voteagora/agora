import { usePaginationFragment, graphql } from "react-relay";
import { css } from "@emotion/css";
import { useCallback, useState, useTransition } from "react";
import { motion } from "framer-motion";
import InfiniteScroll from "react-infinite-scroller";
import { Tab } from "@headlessui/react";

import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import {
  Location,
  useLocation,
  useNavigate,
} from "../../components/HammockRouter/HammockRouter";
import { icons } from "../../icons/icons";

import { VoterCard } from "./VoterCard";
import { VoterTabular } from "./VoterTabular";
import { DelegatesContainerFragment$key } from "./__generated__/DelegatesContainerFragment.graphql";
import { Selector, SelectorItem } from "./Selector";
import type { LocationVariables } from "./HomePageRoute";
import { DelegatesOrder } from "./__generated__/DelegatesContainerPaginationQuery.graphql";

type Props = {
  fragmentKey: DelegatesContainerFragment$key;
  variables: LocationVariables;
};

const layoutModeValidValues = ["card", "tabular"] as const;
type LayoutModes = typeof layoutModeValidValues;
type LayoutMode = LayoutModes[number];

const layoutModeSelectorStyles = css`
  cursor: pointer;
  width: ${theme.spacing["8"]};
  height: ${theme.spacing["8"]};
  padding: ${theme.spacing["1"]};
  opacity: 0.3;
  transiton: all 200ms;

  :hover {
    opacity: 1;
  }
`;

const layoutModeSelectorSelectedStyles = css`
  opacity: 1;
`;

const orderNames: { [K in DelegatesOrder]?: string } = {
  mostVotingPower: "Most nouns represented",
  mostVotesCast: "Most votes cast",
  leastVotesCast: "Least votes cast",
};

function layoutModeFromLocation(location: Location): LayoutMode {
  return (
    layoutModeValidValues.find(
      (needle) => needle === location.search["layoutMode"]
    ) ?? "card"
  );
}

export function DelegatesContainer({ fragmentKey, variables }: Props) {
  const [isPending, startTransition] = useTransition();
  const [localOrderBy, setLocalOrderBy] = useState<DelegatesOrder>(
    variables.orderBy
  );

  const location = useLocation();
  const layoutMode = layoutModeFromLocation(location);

  const navigate = useNavigate();

  function setLayoutMode(layoutMode: LayoutMode) {
    navigate({
      search: {
        layoutMode: layoutMode === "card" ? null : layoutMode,
      },
    });
  }

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
      )
      @refetchable(queryName: "DelegatesContainerPaginationQuery") {
        voters: delegates(first: $first, after: $after, orderBy: $orderBy)
          @connection(key: "DelegatesContainerFragment_voters") {
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

  function setOrderBy(orderBy: DelegatesOrder) {
    setLocalOrderBy(orderBy);
    startTransition(() => {
      navigate({
        search: {
          orderBy: orderBy === "mostDelegates" ? null : orderBy ?? null,
        },
      });
    });
  }

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
          @media (max-width: ${theme.maxWidth.lg}) {
            margin-bottom: ${theme.spacing["4"]};
          }
        `}
      >
        <HStack
          alignItems="baseline"
          gap="2"
          justifyContent="space-between"
          className={css`
            @media (max-width: ${theme.maxWidth.lg}) {
              margin-top: ${theme.spacing["4"]};
            }
          `}
        >
          <h2
            className={css`
              font-size: ${theme.fontSize["2xl"]};
              font-weight: ${theme.fontWeight.extrabold};
            `}
          >
            Voters
          </h2>

          <HStack gap="4" className={css``}>
            <HStack
              alignItems="center"
              className={css`
                background: #f7f7f7;
                border-radius: ${theme.borderRadius.full};
                padding: 0 ${theme.spacing["4"]};
                @media (max-width: ${theme.maxWidth.lg}) {
                  display: none;
                }
              `}
            >
              <Tab.Group
                selectedIndex={(() =>
                  layoutModeValidValues.indexOf(layoutMode))()}
                onChange={(i) => {
                  setLayoutMode(layoutModeValidValues[i]);
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
                      <img
                        alt="card view switch"
                        src={icons.cardView}
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
                      <img
                        alt="table view switch"
                        src={icons.tableView}
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
            <Selector
              items={Object.entries(orderNames).map(
                ([value, title]): SelectorItem<DelegatesOrder> => ({
                  title,
                  value: value as DelegatesOrder,
                })
              )}
              value={isPending ? localOrderBy : variables.orderBy}
              onChange={(orderBy) => setOrderBy(orderBy)}
              size={"l"}
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
            className={(() => {
              switch (layoutMode) {
                case "card":
                  return css`
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
                  `;

                case "tabular":
                  return css`
                    box-shadow: ${theme.boxShadow.newDefault};
                    border-radius: ${theme.borderRadius.xl};
                    border: 1px solid ${theme.colors.gray.eb};
                    display: grid;
                    grid-template-columns: 1fr;
                    background: ${theme.colors.white};

                    // todo: this affects more things than affected
                    & a:first-child > div {
                      border-top: 0px;
                    }
                  `;
              }
            })()}
          >
            {voters.edges.map(({ node: voter }) => {
              switch (layoutMode) {
                case "card":
                  return <VoterCard key={voter.id} fragmentRef={voter} />;

                case "tabular":
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
