import { css } from "@emotion/css";
import { useCallback } from "react";
import { motion } from "framer-motion";
import { HStack, VStack } from "../../components/VStack";
import * as theme from "../../theme";
import { useFragment, usePaginationFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFApplicationContainerFragment$key } from "./__generated__/RetroPGFApplicationContainerFragment.graphql";
import { RetroPGFApplicationContainerApplicationFragment$key } from "./__generated__/RetroPGFApplicationContainerApplicationFragment.graphql";
import InfiniteScroll from "react-infinite-scroller";
import ProjectPlaceholder from "./ProjectPlaceholder.svg";

export const RetroPGFApplicationContainer = ({
  fragmentKey,
  isPending,
}: {
  fragmentKey: RetroPGFApplicationContainerFragment$key;
  isPending?: boolean;
}) => {
  const {
    data: {
      retroPGF: { applications },
    },
    loadNext,
    hasNext,
    isLoadingNext,
  } = usePaginationFragment(
    graphql`
      fragment RetroPGFApplicationContainerFragment on Query
      @argumentDefinitions(
        first: { type: "Int", defaultValue: 30 }
        after: { type: "String" }
        orderBy: { type: "ProjectOrder", defaultValue: alphabeticalAZ }
        category: { type: "[ProjectCategory!]" }
        seed: { type: "String" }
        search: { type: "String" }
      )
      @refetchable(queryName: "RetroPGFApplicationContainerPaginationQuery") {
        retroPGF {
          applications: projects(
            first: $first
            after: $after
            orderBy: $orderBy
            category: $category
            seed: $seed
            search: $search
          )
            @connection(
              key: "RetroPGFApplicationContainerFragment_applications"
            ) {
            edges {
              node {
                id
                ...RetroPGFApplicationContainerApplicationFragment
              }
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
          {applications.edges.map((application) => (
            <Application
              key={application.node.id}
              fragmentRef={application.node}
            />
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
  );
};

const truncateText = (text: string, length: number = 120): string => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

const Application = ({
  fragmentRef,
}: {
  fragmentRef: RetroPGFApplicationContainerApplicationFragment$key;
}) => {
  const project = useFragment(
    graphql`
      fragment RetroPGFApplicationContainerApplicationFragment on Project {
        id
        displayName
        bio
        impactCategory
        profile {
          profileImageUrl
          bannerImageUrl
        }
      }
    `,
    fragmentRef
  );

  return (
    <a
      href={`/retropgf/3/application/${parseProjectId(project.id)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <div
        className={css`
          border-radius: ${theme.spacing["3"]};
          background: ${theme.colors.white};
          border-width: ${theme.spacing.px};
          border-color: ${theme.colors.gray["300"]};
          box-shadow: ${theme.boxShadow.newDefault};
          text-align: left;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          padding-bottom: 80px;
          height: ${theme.spacing["72"]};
        `}
      >
        <div
          className={css`
            position: relative;
            overflow: hidden;
            height: 58%;
            width: 100%;
            border-radius: ${theme.spacing["4"]};
            border: 8px solid #fff;

            &::before {
              content: "";
              position: absolute;
              top: 0;
              right: 0;
              bottom: 0;
              left: 0;
              background-image: url(${project.profile?.bannerImageUrl
                ? project.profile.bannerImageUrl
                : project.profile?.profileImageUrl ?? ""});
              filter: blur(${project.profile?.bannerImageUrl ? "0px" : "40px"});
              background-size: cover;
              background-color: ${theme.colors.gray.fa};
              background-position: center;
            }
          `}
        ></div>

        <img
          src={project.profile?.profileImageUrl ?? ProjectPlaceholder}
          alt={`${project.displayName} icon`}
          className={css`
            height: 60px;
            width: 60px;
            position: absolute;
            outline: 4px solid #fff;
            border-radius: 10px;
            background: #fff;
            left: 24px;
            top: calc(33% - 25px);
            z-index: 2;
          `}
        />

        <VStack
          justifyContent="space-between"
          className={css`
            padding: 8px 24px;
            height: 72%;
          `}
        >
          <div>
            <h3
              className={css`
                font-weight: ${theme.fontWeight.medium};
                margin-top: ${theme.spacing["2"]};
              `}
            >
              {project.displayName}
            </h3>
            <p
              className={css`
                font-size: ${theme.fontSize["sm"]};
                color: #888;
              `}
            >
              {truncateText(project.bio)}
            </p>
          </div>
          <CategoryListItem
            categories={project.impactCategory}
          ></CategoryListItem>
        </VStack>
      </div>
    </a>
  );
};

const CategoryListItem = ({
  categories,
}: {
  categories: readonly string[];
}) => {
  return (
    <HStack
      className={css`
        display: flex;
        flex-wrap: wrap;
      `}
    >
      {categories.map((category) => (
        <div
          key={category}
          className={css`
            background: ${theme.colors.gray["fa"]};
            gap: 0;
            font-size: ${theme.fontSize.xs};
            color: ${theme.colors.gray[700]};
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: ${theme.borderRadius.full};
            margin-top: ${theme.spacing["2"]};
            padding: 0 ${theme.spacing["2"]};
          `}
        >
          {formatCategory(category)}
        </div>
      ))}
    </HStack>
  );
};

function formatCategory(category: string) {
  switch (category) {
    case "OP_STACK":
      return "OP Stack";
    case "END_USER_EXPERIENCE_AND_ADOPTION":
      return "End User Experience & Adoption";
    default:
      return category
        .split("_")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
  }
}

function parseProjectId(projectId: string): string {
  return projectId.split("|")[1];
}
