import { css } from "@emotion/css";
import { useRef, useState, useTransition } from "react";
import { VStack, HStack } from "../../components/VStack";
import { Tab } from "../../components/Tab";
import * as theme from "../../theme";
import { icons } from "../../icons/icons";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RPGFVariables } from "./RetroPGFRoute";
import { RetroPGFApplicationContainerFragment$key } from "./__generated__/RetroPGFApplicationContainerFragment.graphql";
import { ProjectOrder } from "./__generated__/RetroPGFApplicationContainerPaginationQuery.graphql";
import { Selector, SelectorItem } from "../HomePage/Selector";
import { useNavigate } from "../../components/HammockRouter/HammockRouter";
import {
  ListCategory,
  ListOrder,
  ProjectCategory,
} from "./__generated__/RetroPGFRouteQuery.graphql";
import { TextInputWithTooltip } from "../../components/Form/TextInputWithTooltip";
import { RetroPGFApplicationContainer } from "./RetroPGFApplicationContainer";
import {
  RetroPGFProjectListContentFragment$data,
  RetroPGFProjectListContentFragment$key,
} from "./__generated__/RetroPGFProjectListContentFragment.graphql";
import { RetroPGFListsContainer } from "./RetroPGFListsContainer";
import { RetroPGFListsContainerFragment$key } from "./__generated__/RetroPGFListsContainerFragment.graphql";
import { useSIWE } from "connectkit";
import { useAccount } from "wagmi";

type Props = {
  fragmentKey: RetroPGFApplicationContainerFragment$key;
  listsFragmentKey: RetroPGFListsContainerFragment$key;
  aggregateFragmentKey: RetroPGFProjectListContentFragment$key;
  variables: RPGFVariables;
};

const orderNames: { [K in ProjectOrder]?: string } = {
  alphabeticalAZ: "Alphabetical (A-Z)",
  alphabeticalZA: "Alphabetical (Z-A)",
  shuffle: "Shuffle",
  byIncludedInBallots: "Included in ballots",
};

const listOrderNames: { [K in ListOrder]?: string } = {
  alphabeticalAZ: "Alphabetical (A-Z)",
  alphabeticalZA: "Alphabetical (Z-A)",
  shuffle: "Shuffle",
  byLikes: "By likes",
};

const filterNames = [
  {
    title: "All projects",
    value: null,
  },
  {
    title: "Collective Governance",
    value: "COLLECTIVE_GOVERNANCE" as const,
  },
  {
    title: "Developer Ecosystem",
    value: "DEVELOPER_ECOSYSTEM" as const,
  },
  {
    title: "End User Experience & Adoption",
    value: "END_USER_EXPERIENCE_AND_ADOPTION" as const,
  },
  {
    title: "OP Stack",
    value: "OP_STACK" as const,
  },
];

const listFilterNames = [
  {
    title: "All lists",
    value: null,
  },
  {
    title: "Pairwise",
    value: "PAIRWISE" as const,
  },
  {
    title: "Collective Governance",
    value: "COLLECTIVE_GOVERNANCE" as const,
  },
  {
    title: "Developer Ecosystem",
    value: "DEVELOPER_ECOSYSTEM" as const,
  },
  {
    title: "End User Experience & Adoption",
    value: "END_USER_EXPERIENCE_AND_ADOPTION" as const,
  },
  {
    title: "OP Stack",
    value: "OP_STACK" as const,
  },
];

function parseCategoryAggregates(
  values: RetroPGFProjectListContentFragment$data,
  filterName: typeof filterNames[0]["value"]
): string {
  switch (filterName) {
    case "COLLECTIVE_GOVERNANCE":
      return values.collectiveGovernance.toString();

    case "DEVELOPER_ECOSYSTEM":
      return values.developerEcosystem.toString();

    case "END_USER_EXPERIENCE_AND_ADOPTION":
      return values.endUserExperienceAndAdoption.toString();

    case "OP_STACK":
      return values.opStack.toString();

    default:
      return "";
  }
}

export function parseOrderName(orderName: string): ProjectOrder | null {
  if (orderName in orderNames) {
    return orderName as any;
  }

  return null;
}

export function parseListOrderName(orderName: string): ListOrder | null {
  if (orderName in listOrderNames) {
    return orderName as any;
  }

  return null;
}

export function parseFilterName(filterName: string): ProjectCategory | null {
  const filter = filterNames.find((filter) => filter.value === filterName);
  return filter ? filter.value : null;
}

export function parseListFilterName(filterName: string): ListCategory | null {
  const filter = listFilterNames.find((filter) => filter.value === filterName);
  return filter ? filter.value : null;
}

export const RetroPGFProjectListContent = ({
  fragmentKey,
  listsFragmentKey,
  aggregateFragmentKey,
  variables,
}: Props) => {
  const [isPending, startTransition] = useTransition();

  const navigate = useNavigate();

  const [localCategory, setLocalCategory] = useState<ProjectCategory | null>(
    variables.category
  );
  const [localLiked, setLocalLiked] = useState<string | null>(
    variables.likedBy
  );
  const [localListCategory, setLocalListCategory] =
    useState<ListCategory | null>(variables.category);
  const inputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"PROJECTS" | "LISTS">(
    variables.tab
  );

  const [localOrderBy, setLocalOrderBy] = useState<ProjectOrder | ListOrder>(
    activeTab === "PROJECTS" ? variables.orderBy : variables.listOrderBy
  );

  const projectsAggregate = useFragment(
    graphql`
      fragment RetroPGFProjectListContentFragment on ProjectsAggregate {
        collectiveGovernance
        developerEcosystem
        endUserExperienceAndAdoption
        opStack
      }
    `,
    aggregateFragmentKey
  );

  const { isSignedIn } = useSIWE();
  const { address } = useAccount();
  const filterNamesWithAggregates = filterNames.map((filter) => ({
    ...filter,
    title: filter.value
      ? `${filter.title} (${parseCategoryAggregates(
          projectsAggregate,
          filter.value
        )})`
      : filter.title,
  }));

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
          margin-bottom: ${theme.spacing["5"]};
        `}
      >
        <HStack
          alignItems="flex-end"
          gap="2"
          justifyContent="space-between"
          className={css`
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              flex-direction: column;
              align-items: flex-start;
            }
          `}
        >
          <HStack alignItems="baseline" gap="4">
            <Tab
              name="PROJECTS"
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
              name="LISTS"
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
            alignItems="baseline"
            gap="2"
            className={css`
              @media (max-width: ${theme.maxWidth["2xl"]}) {
                flex-direction: column;
                align-items: stretch;
                width: 100%;
              }
            `}
          >
            <div
              className={css`
                position: relative;
              `}
            >
              <TextInputWithTooltip
                onChange={(value) => {
                  startTransition(() => {
                    navigate({ search: { search: value, orderBy: null } });
                  });
                }}
                placeholder={`Search ${activeTab.toLowerCase()}`}
                inputRef={inputRef}
                defaultValue={variables.search}
                tooltipMessage="Searches project names and descriptions"
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
              <img
                className={css`
                  position: absolute;
                  top: 50%;
                  left: ${theme.spacing["3"]};
                  transform: translateY(-50%);
                  fill: #afafaf;
                  pointer-events: none;
                `}
                src={icons.search}
                alt={"search"}
              />
            </div>
            <HStack
              gap="2"
              className={css`
                @media (max-width: ${theme.maxWidth["2xl"]}) {
                  flex-direction: column;
                  align-items: stretch;
                }
              `}
            >
              {activeTab === "PROJECTS" && (
                <Selector
                  items={
                    filterNamesWithAggregates as SelectorItem<ProjectCategory | null>[]
                  }
                  value={isPending ? localCategory : variables.category}
                  onChange={(category) => {
                    setLocalCategory(category);
                    startTransition(() => {
                      navigate({ search: { category: category ?? null } });
                    });
                  }}
                />
              )}
              {activeTab === "LISTS" && (
                <>
                  {" "}
                  {isSignedIn && address && (
                    <Selector
                      items={[
                        { title: "All", value: null },
                        { title: "Liked", value: address },
                      ]}
                      value={isPending ? localLiked : variables.likedBy}
                      onChange={(likedBy) => {
                        setLocalLiked(likedBy);
                        startTransition(() => {
                          navigate({ search: { likedBy: likedBy ?? null } });
                        });
                      }}
                    />
                  )}
                  <Selector
                    items={
                      listFilterNames as SelectorItem<ListCategory | null>[]
                    }
                    value={
                      isPending ? localListCategory : variables.listCategory
                    }
                    onChange={(listCategory) => {
                      setLocalListCategory(listCategory);
                      startTransition(() => {
                        navigate({
                          search: { listCategory: listCategory ?? null },
                        });
                      });
                    }}
                  />
                </>
              )}

              <Selector
                items={Object.entries(
                  activeTab === "PROJECTS" ? orderNames : listOrderNames
                ).map(
                  ([value, title]): SelectorItem<ProjectOrder> => ({
                    title,
                    value: value as ProjectOrder,
                  })
                )}
                value={
                  isPending
                    ? localOrderBy
                    : activeTab === "PROJECTS"
                    ? variables.orderBy
                    : variables.listOrderBy
                }
                onChange={(orderBy) => {
                  setLocalOrderBy(orderBy);
                  if (inputRef.current) {
                    inputRef.current.value = "";
                  }
                  startTransition(() => {
                    navigate({
                      search: {
                        orderBy:
                          activeTab === "PROJECTS"
                            ? orderBy === "shuffle"
                              ? null
                              : orderBy ?? null
                            : null,
                        listOrderBy:
                          activeTab === "LISTS"
                            ? orderBy === "alphabeticalAZ"
                              ? null
                              : orderBy ?? null
                            : null,
                        search: null,
                      },
                    });
                  });
                }}
              />

              {activeTab === "LISTS" && (
                <a
                  href={`https://round3.optimism.io/lists/create?redirectTo=${window.location.href}`}
                  className={css`
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    background: ${theme.colors.black};
                    padding: ${theme.spacing[2]} ${theme.spacing[5]};
                    border-radius: ${theme.borderRadius.full};
                    color: ${theme.colors.white};
                  `}
                >
                  Create list
                </a>
              )}
            </HStack>
          </HStack>
        </HStack>
      </VStack>

      {(() => {
        switch (activeTab) {
          case "PROJECTS":
            return (
              <RetroPGFApplicationContainer
                fragmentKey={fragmentKey}
                isPending={isPending}
              />
            );

          case "LISTS":
            return (
              <RetroPGFListsContainer
                fragmentKey={listsFragmentKey}
                isPending={isPending}
              />
            );
        }
      })()}
    </VStack>
  );
};
