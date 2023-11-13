import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VStack, HStack } from "../../components/VStack";
import { Link } from "../../components/HammockRouter/Link";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFListRowFragment$key } from "./__generated__/RetroPGFListRowFragment.graphql";
import { NounResolvedName } from "../../components/NounResolvedName";
import { ENSAvatar } from "../../components/ENSAvatar";
import { icons } from "../../icons/icons";
import ProjectPlaceholder from "./ProjectPlaceholder.svg";
import { useLikes } from "./RetroPGFVoterStore/useLikes";
import { useSIWE } from "connectkit";

export function RetroPGFListRow({
  fragmentRef,
}: {
  fragmentRef: RetroPGFListRowFragment$key;
}) {
  const list = useFragment(
    graphql`
      fragment RetroPGFListRowFragment on List {
        id
        author {
          resolvedName {
            ...NounResolvedNameFragment
            ...ENSAvatarFragment
          }
        }
        listName
        listDescription
        categories
        listContentCount
        listContentShort {
          project {
            displayName
            profile {
              profileImageUrl
            }
          }
        }
      }
    `,
    fragmentRef
  );

  const MAX_APPLICATION_PER_ROW = 12;
  const extraAppsCount = Math.max(
    0,
    list.listContentCount - MAX_APPLICATION_PER_ROW
  );

  const { isSignedIn } = useSIWE();

  const { likesForList, isListLiked, likeList } = useLikes();

  return (
    <HStack
      justifyContent="space-between"
      alignItems="center"
      className={css`
        margin: 0;
        height: 100%;
        border-bottom: 1px solid ${theme.colors.gray[300]};
        max-width: ${theme.maxWidth["6xl"]};
        padding: ${theme.spacing["4"]} ${theme.spacing["4"]};
      `}
    >
      <VStack
        alignItems="stretch"
        className={css`
          flex: 1;
          max-width: 50%;
          padding-right: ${theme.spacing["16"]};
          @media (max-width: ${theme.maxWidth["lg"]}) {
            max-width: 100%;
            padding-right: 0;
          }
        `}
      >
        <Link to={`/retropgf/3/list/${parseListId(list.id)}`}>
          <div
            className={css`
              font-weight: ${theme.fontWeight.medium};
            `}
          >
            {list.listName}
          </div>
          <div
            className={css`
              display: -webkit-box;
              word-break: break-word;
              color: ${theme.colors.gray[700]};
              overflow: hidden;
              text-overflow: ellipsis;
              line-clamp: 1;
              -webkit-line-clamp: 1;
              -webkit-box-orient: vertical;
              font-size: ${theme.fontSize.base};
              line-height: ${theme.lineHeight.normal};
            `}
          >
            {list.listDescription}
          </div>
        </Link>
        <HStack
          alignItems="center"
          className={css`
            align-items: center;
            font-size: ${theme.fontSize.sm};
            color: ${theme.colors.gray[700]};
            margin-top: ${theme.spacing["2"]};
          `}
        >
          <HStack gap="1" alignItems="center">
            <ENSAvatar
              className={css`
                width: 20px;
                height: 20px;
                border-radius: 100%;
                margin: 2px;
              `}
              fragment={list.author.resolvedName}
            />
            <NounResolvedName resolvedName={list.author.resolvedName} />
          </HStack>
          <span
            className={css`
              color: #e0e0e0;
              margin: 0 ${theme.spacing["3"]};
            `}
          >
            |
          </span>
          <HStack alignItems="center" gap="1">
            <img
              src={
                isListLiked(parseListId(list.id)) ? icons.heartRed : icons.heart
              }
              alt={"likes"}
              className={css`
                width: ${theme.spacing["4"]};
                height: ${theme.spacing["4"]};
                cursor: ${isSignedIn ? "pointer" : "default"};
              `}
              onClick={() => {
                likeList(parseListId(list.id));
              }}
            />
            {likesForList(parseListId(list.id))}
          </HStack>
        </HStack>
      </VStack>
      <Link to={`/retropgf/3/list/${parseListId(list.id)}`}>
        <VStack
          gap="4"
          justifyContent="space-between"
          className={css`
            height: 100%;
            flex: 1;
            overflow-x: auto;
            @media (max-width: ${theme.maxWidth["lg"]}) {
              display: none;
            }
          `}
        >
          <HStack justifyContent="flex-end">
            {list.listContentShort
              .slice(0, MAX_APPLICATION_PER_ROW)
              .map((app, index) => (
                <img
                  key={index}
                  src={
                    app.project.profile?.profileImageUrl ?? ProjectPlaceholder
                  }
                  alt={`${app.project.displayName} icon`}
                  className={css`
                    width: 40px;
                    height: 40px;
                    position: relative;
                    left: ${-index * 8}px;
                    z-index: ${index};
                    border: 3px solid #000;
                    border-radius: 8px;
                    border-color: #fff;
                    background: #fff;
                    box-shadow: ${theme.boxShadow.newDefault};
                    @media (max-width: ${theme.maxWidth["lg"]}) {
                      top: 200px;
                      left: 50%;
                      transform: translateX(-50%);
                    }
                  `}
                />
              ))}
            {extraAppsCount > 0 && (
              <div
                className={css`
                  box-sizing: border-box;
                  background: #fafafa;
                  border: 2px solid #ffffff;
                  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.02),
                    0px 2px 2px rgba(0, 0, 0, 0.03);
                  border-radius: 8px;
                  width: 35px;
                  height: 35px;
                  background-color: whote;
                  color: #4f4f4f;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  position: relative;
                  font-family: "Inter";
                  font-style: normal;
                  font-weight: 600;
                  font-size: 12px;
                  line-height: 16px;
                  left: ${-MAX_APPLICATION_PER_ROW * 7}px;
                  z-index: ${MAX_APPLICATION_PER_ROW};
                `}
              >
                +{extraAppsCount}
              </div>
            )}
          </HStack>
          <HStack>
            <CategoryListItem categories={list.categories}></CategoryListItem>
          </HStack>
        </VStack>
      </Link>
    </HStack>
  );
}

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
        align-items: right;
      `}
      gap="1"
    >
      {categories.slice(0, 3).map((category) => (
        <div
          key={category}
          className={css`
            background: ${theme.colors.gray.fa};
            gap: 0;
            font-size: ${theme.fontSize.xs};
            color: ${theme.colors.gray[700]};
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: ${theme.borderRadius.full};
            padding: 0 ${theme.spacing["2"]};
          `}
        >
          {formatCategory(category)}
        </div>
      ))}
      {categories.length > 3 && (
        <div
          className={css`
            background: ${theme.colors.gray.fa};
            gap: 0;
            font-size: ${theme.fontSize.xs};
            color: ${theme.colors.gray[700]};
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: ${theme.borderRadius.full};
            padding: 0 ${theme.spacing["2"]};
          `}
        >
          + more
        </div>
      )}
    </HStack>
  );
};

function formatCategory(category: string) {
  switch (category) {
    case "OP_STACK":
      return "OP stack";
    case "END_USER_EXPERIENCE_AND_ADOPTION":
      return "End user experience & adoption";
    default:
      return (
        category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
      )
        .split("_")
        .join(" ");
  }
}

function parseListId(listId: string): string {
  return listId.split("|")[1];
}
