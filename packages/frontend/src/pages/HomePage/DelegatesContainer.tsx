import { usePaginationFragment } from "react-relay";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCard } from "./VoterCard";
import {
  DelegatesContainerFragment$data,
  DelegatesContainerFragment$key,
} from "./__generated__/DelegatesContainerFragment.graphql";
import { HStack, VStack } from "../../components/VStack";
import { CSSProperties, useEffect, useState, useTransition } from "react";
import {
  DelegatesOrder,
  DelegatesWhere,
} from "./__generated__/DelegatesContainerPaginationQuery.graphql";
import { Selector, SelectorItem } from "./Selector";
import { motion } from "framer-motion";
import { useNavigate } from "../../components/HammockRouter/HammockRouter";
import { locationToVariables } from "./HomePage";
import { useWindowVirtualizer, VirtualItem } from "@tanstack/react-virtual";

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

  type ItemType =
    | {
        type: "LOADING";
      }
    | {
        type: "LOAD_MORE_SENTINEL";
      }
    | {
        type: "ITEM";
        node: DelegatesContainerFragment$data["voters"]["edges"][0]["node"];
      };

  const items: ItemType[] = [
    ...voters.edges.map((node) => ({ type: "ITEM" as const, node: node.node })),
    ...(() => {
      if (isLoadingNext) {
        return [{ type: "LOADING" as const }];
      }

      if (hasNext) {
        return [
          {
            type: "LOAD_MORE_SENTINEL" as const,
          },
        ];
      } else {
        return [];
      }
    })(),
  ];

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize(idx) {
      switch (items[idx].type) {
        case "LOADING":
          return 100;

        case "LOAD_MORE_SENTINEL":
          return 0;

        case "ITEM":
          return 350;
      }
    },
    onChange(instance) {
      const virtualItems = instance.getVirtualItems();
      const lastItem = virtualItems[virtualItems.length - 1];

      if (!lastItem) {
        return;
      }

      const item = items[lastItem.index];
      if (!item) {
        return;
      }

      if (item.type === "LOAD_MORE_SENTINEL") {
        loadNext(30);
      }
    },
  });

  useEffect(() => {}, []);

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
            height: ${virtualizer.getTotalSize()}px;
            position: relative;
          `}
        >
          {virtualizer.getVirtualItems().map((virtualItem: VirtualItem) => {
            const item = items[virtualItem.index];

            const style: CSSProperties = {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            };

            switch (item.type) {
              case "LOADING": {
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

              case "ITEM": {
                return <VoterCard fragmentRef={item.node} style={style} />;
              }

              case "LOAD_MORE_SENTINEL":
                return null;
            }
          })}
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
