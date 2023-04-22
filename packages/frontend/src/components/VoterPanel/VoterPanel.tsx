import { css } from "@emotion/css";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";

import * as theme from "../../theme";
import { DelegateProfileImage } from "../DelegateProfileImage";
import { VStack } from "../VStack";

import { NameSection } from "./NameSection";
import { DelegateFromList } from "./Rows/DelegateFromListRow";
import { DelegatedToListRow } from "./Rows/DelegatedToListRow";
import { ForAgainstAbstainRow } from "./Rows/ForAgainstAbstainRow";
import { ProposalsCreatedRow } from "./Rows/ProposalsCreatedRow";
import { ProposalsVotedRow } from "./Rows/ProposalsVotedRow";
import { RecentActivityRow } from "./Rows/RecentActivityRow";
import { TotalVotePowerRow } from "./Rows/TotalVotePowerRow";
import { VotePowerRow } from "./Rows/VotePowerRow";
import { VoterPanelActions } from "./VoterPanelActions";
import { VoterPanelFragment$key } from "./__generated__/VoterPanelFragment.graphql";

type Props = {
  fragment: VoterPanelFragment$key;
};

export function VoterPanel({ fragment }: Props) {
  const delegate = useFragment(
    graphql`
      fragment VoterPanelFragment on Delegate {
        ...NameSectionFragment

        ...ProposalsCreatedRowFragment
        ...RecentActivityRowFragment

        ...DelegateFromListRowFragment
        ...DelegatedToListRowFragment
        ...TotalVotePowerRowFragment
        ...ForAgainstAbstainRowFragment
        ...VotePowerRowFragment
        ...ProposalsVotedRowFragment

        ...DelegateProfileImageFragment
        ...VoterPanelActionsFragment
      }
    `,
    fragment
  );

  return (
    <VStack
      className={css`
        background-color: ${theme.colors.white};
        border-radius: ${theme.spacing["3"]};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
        box-shadow: ${theme.boxShadow.newDefault};
      `}
    >
      <VStack
        alignItems="center"
        className={css`
          padding: ${theme.spacing["4"]};
          border-bottom: ${theme.spacing.px} solid ${theme.colors.gray["300"]};
        `}
      >
        <DelegateProfileImage fragment={delegate} dense />
      </VStack>

      <div
        className={css`
          ${css`
            display: flex;
            flex-direction: column;
            padding: ${theme.spacing["6"]} ${theme.spacing["6"]};
          `};
        `}
      >
        <VStack gap="4">
          <NameSection resolvedName={delegate} />

          <VStack gap="2">
            <TotalVotePowerRow fragmentKey={delegate} />
            <ProposalsVotedRow fragment={delegate} />
            <VotePowerRow fragment={delegate} />
            <ForAgainstAbstainRow fragment={delegate} />
            <RecentActivityRow fragment={delegate} />
            <ProposalsCreatedRow fragment={delegate} />
            <DelegateFromList fragment={delegate} />
            <DelegatedToListRow fragmentRef={delegate} />
          </VStack>

          <VoterPanelActions fragment={delegate} />
        </VStack>
      </div>
    </VStack>
  );
}
