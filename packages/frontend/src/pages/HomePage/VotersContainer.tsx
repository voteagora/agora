import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { DelegatesContainerFragment$key } from "./__generated__/DelegatesContainerFragment.graphql";
import { HStack, VStack } from "../../components/VStack";
import { useState, useTransition } from "react";
import { DelegatesOrder } from "./__generated__/DelegatesContainerPaginationQuery.graphql";
import { Selector, SelectorItem } from "./Selector";
import { useNavigate } from "../../components/HammockRouter/HammockRouter";
import { Variables } from "./HomePageRoute";
import { TextInputWithTooltip } from "../../components/Form/TextInputWithTooltip";
import { Tab } from "../../components/Tab";
import { DelegatesContainer } from "./DelegatesContainer";
import { CitizensContainer } from "./CitizensContainer";
import { CitizensContainerFragment$key } from "./__generated__/CitizensContainerFragment.graphql";
import { CitizensOrder } from "./__generated__/HomePageRouteQuery.graphql";

type Props = {
  fragmentKey: DelegatesContainerFragment$key;
  citizensFragmentKey: CitizensContainerFragment$key;
  variables: Variables;
};

const orderNames: { [K in DelegatesOrder]?: string } = {
  weightedRandom: "Weighted random",
  mostVotingPower: "Most voting power",
  mostDelegates: "Most delegators",
};

const citizensOrderNames: { [K in CitizensOrder]?: string } = {
  shuffle: "Shuffle",
  mostVotingPower: "Most voting power",
};

export function parseOrderName(orderName: string): DelegatesOrder | null {
  if (orderName in orderNames) {
    return orderName as any;
  }

  return null;
}

export function parseCitizensOrderName(
  orderName: string
): CitizensOrder | null {
  if (orderName in orderNames) {
    return orderName as any;
  }

  return null;
}

export function VotersContainer({
  fragmentKey,
  variables,
  citizensFragmentKey,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"DELEGATES" | "CITIZENS">(
    variables.tab
  );

  const [localOrderBy, setLocalOrderBy] = useState<
    DelegatesOrder | CitizensOrder
  >(activeTab === "DELEGATES" ? variables.orderBy : variables.citizensOrderBy);

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
          margin-bottom: ${theme.spacing["2"]};
        `}
      >
        <HStack
          alignItems="flex-end"
          gap="2"
          justifyContent="space-between"
          className={css`
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              flex-direction: column;
              align-items: stretch;
            }
          `}
        >
          <HStack gap="4">
            <Tab
              name="DELEGATES"
              activePage={activeTab}
              className={css`
                font-size: ${theme.fontSize["2xl"]};
                font-weight: ${theme.fontWeight["extrabold"]};
              `}
              setActivePage={(it) => {
                setActiveTab(it);
                startTransition(() => {
                  navigate({
                    search: {
                      tab: it.toLowerCase(),
                    },
                  });
                });
              }}
            />
            <Tab
              name="CITIZENS"
              activePage={activeTab}
              className={css`
                font-size: ${theme.fontSize["2xl"]};
                font-weight: ${theme.fontWeight["extrabold"]};
              `}
              setActivePage={(it) => {
                setActiveTab(it);
                startTransition(() => {
                  navigate({
                    search: {
                      tab: it.toLowerCase(),
                    },
                  });
                });
              }}
            />
          </HStack>

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
              items={Object.entries(
                activeTab === "DELEGATES" ? orderNames : citizensOrderNames
              ).map(
                ([value, title]): SelectorItem<
                  DelegatesOrder | CitizensOrder
                > => ({
                  title,
                  value: value as DelegatesOrder | CitizensOrder,
                })
              )}
              value={
                isPending
                  ? localOrderBy
                  : activeTab === "DELEGATES"
                  ? variables.orderBy
                  : variables.citizensOrderBy
              }
              onChange={(orderBy) => {
                setLocalOrderBy(orderBy);
                startTransition(() => {
                  navigate({
                    search: {
                      orderBy:
                        activeTab === "DELEGATES"
                          ? orderBy === "weightedRandom"
                            ? null
                            : orderBy ?? null
                          : null,
                      citizensOrderBy:
                        activeTab === "CITIZENS"
                          ? orderBy === "shuffle"
                            ? null
                            : orderBy ?? null
                          : null,
                    },
                  });
                });
              }}
            />
          </HStack>
        </HStack>
      </VStack>

      {(() => {
        switch (activeTab) {
          case "DELEGATES":
            return (
              <DelegatesContainer
                fragmentKey={fragmentKey}
                isPending={isPending}
              />
            );

          case "CITIZENS":
            return <CitizensContainer fragmentKey={citizensFragmentKey} />;
        }
      })()}
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

        <TextInputWithTooltip
          onChange={(value) => setEnteredName(value)}
          placeholder="Exact ENS or address"
          tooltipMessage="Please input exact ENS or address. Partial and fuzzy search is not supported yet."
          className={css`
            padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
            padding-left: ${theme.spacing["8"]};
            border-radius: ${theme.borderRadius.full};
            background: #fafafa;
            border-color: #ebebeb;
            border-width: 1px;
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              width: 100%;
            }

            &::placeholder {
              color: #afafaf;
            }
          `}
        />
      </VStack>
    </form>
  );
};
