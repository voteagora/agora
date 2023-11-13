import { css } from "@emotion/css";
import { VStack, HStack } from "../../../components/VStack";
import * as theme from "../../../theme";
import { buttonStyles } from "../../EditDelegatePage/EditDelegatePage";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFListPageHeaderFragment$key } from "./__generated__/RetroPGFListPageHeaderFragment.graphql";
import { ENSAvatar } from "../../../components/ENSAvatar";
import { NounResolvedName } from "../../../components/NounResolvedName";
import { icons } from "../../../icons/icons";
import { useSIWE } from "connectkit";
import { useBallot } from "../RetroPGFVoterStore/useBallot";
import { useOpenDialog } from "../../../components/DialogProvider/DialogProvider";
import { RetroPGFStep } from "../BallotModal/RetroPGFAddToBallotModal";
import { useLikes } from "../RetroPGFVoterStore/useLikes";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function RetroPGFListPageHeader({
  fragmentRef,
}: {
  fragmentRef: RetroPGFListPageHeaderFragment$key;
}) {
  const list = useFragment(
    graphql`
      fragment RetroPGFListPageHeaderFragment on List {
        id
        author {
          resolvedName {
            ...NounResolvedNameFragment
            ...ENSAvatarFragment
          }
        }
        listName
        # eslint-disable-next-line relay/must-colocate-fragment-spreads
        ...RetroPGFAddListToBallotModalContentFragment
      }
    `,
    fragmentRef
  );

  const { isSignedIn } = useSIWE();
  const { signature } = useBallot();
  const { address } = useAccount();

  const { isListLiked, likesForList, likeList } = useLikes();

  const openDialog = useOpenDialog();

  useEffect(() => {
    if (address && isSignedIn && list.id && list.listName) {
      (window as any).plausible("RetroPGFListView", {
        props: {
          listName: list.listName,
          listId: list.id,
          badgeholder: address,
        },
      });
    }
  }, [address, isSignedIn, list.id, list.listName]);

  return (
    <>
      <HStack
        justifyContent="space-between"
        alignItems="center"
        className={css`
          width: 100%;
          max-width: ${theme.maxWidth["6xl"]};
          padding-bottom: ${theme.spacing["8"]};
          padding-right: ${theme.spacing["4"]};
        `}
      >
        <VStack
          gap="1"
          alignItems="flex-start"
          className={css`
            padding-left: ${theme.spacing["4"]};
            padding-right: ${theme.spacing["4"]};
            max-width: ${theme.maxWidth["6xl"]};
          `}
        >
          <HStack
            alignItems="center"
            className={css`
              align-items: center;
              margin-top: ${theme.spacing["4"]};
              font-size: ${theme.fontSize.sm};
              color: ${theme.colors.gray[700]};
            `}
            gap="2"
          >
            <HStack
              alignItems="center"
              className={css`
                margin-right: ${theme.spacing["2"]};
              `}
              gap="2"
            >
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
              `}
            >
              |
            </span>
            <HStack
              alignItems="center"
              className={css`
                margin: ${theme.spacing["1"]} 0;
              `}
              gap="1"
            >
              <img
                src={
                  isListLiked(parseListId(list.id))
                    ? icons.heartRed
                    : icons.heart
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
          <h2
            className={css`
              font-family: "Inter";
              font-style: normal;
              font-weight: 900;
              font-size: 24px;
              line-height: 32px;
              color: #000000;
            `}
          >
            {list.listName}
          </h2>
        </VStack>
        {isSignedIn && (
          <HStack
            gap="4"
            className={css`
              @media (max-width: ${theme.maxWidth["2xl"]}) {
                margin-top: ${theme.spacing["4"]};
              }
            `}
          >
            <button
              className={css`
                ${buttonStyles};
              `}
              onClick={() => {
                likeList(parseListId(list.id));
              }}
            >
              Like
            </button>
            {!signature && (
              <button
                className={css`
                  ${buttonStyles};
                `}
                onClick={() =>
                  openDialog({
                    type: "RPGF",
                    params: {
                      step: RetroPGFStep.BALLOT,
                      listFragmentRef: list,
                    },
                  })
                }
              >
                Add to Ballot
              </button>
            )}
          </HStack>
        )}
      </HStack>
    </>
  );
}

function parseListId(listId: string): string {
  return listId.split("|")[1];
}
