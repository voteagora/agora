import { css } from "@emotion/css";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { ENSAvatar } from "../../../components/ENSAvatar";
import { NounResolvedName } from "../../../components/NounResolvedName";
import { VStack, HStack } from "../../../components/VStack";
import * as theme from "../../../theme";
import { RetroPGFBallotPageHeaderFragment$key } from "./__generated__/RetroPGFBallotPageHeaderFragment.graphql";

export default function RetroPGFBallotPageHeader({
  fragmentRef,
}: {
  fragmentRef: RetroPGFBallotPageHeaderFragment$key;
}) {
  const { resolvedName } = useFragment(
    graphql`
      fragment RetroPGFBallotPageHeaderFragment on Address {
        resolvedName {
          ...NounResolvedNameFragment
          ...ENSAvatarFragment
        }
      }
    `,
    fragmentRef
  );

  return (
    <VStack
      gap="2"
      alignItems="flex-start"
      className={css`
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
        margin-top: ${theme.spacing["4"]};
        max-width: ${theme.maxWidth["6xl"]};
        @media (max-width: ${theme.maxWidth["2xl"]}) {
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-end;
        }
      `}
    >
      <HStack
        gap="1"
        alignItems="center"
        className={css`
          font-size: ${theme.fontSize.sm};
          color: ${theme.colors.gray[700]};
        `}
      >
        <ENSAvatar
          className={css`
            width: 20px;
            height: 20px;
            border-radius: 100%;
            margin: 2px;
          `}
          fragment={resolvedName}
        />
        <NounResolvedName resolvedName={resolvedName} />
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
        My RetroPGF Round 3 Ballot
      </h2>
    </VStack>
  );
}
