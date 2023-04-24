import { useFragment, graphql } from "react-relay";
import { css } from "@emotion/css";

import * as theme from "../../theme";
import { VStack } from "../VStack";
import { DelegateProfileImage } from "../DelegateProfileImage";

import { ProposalsVotedRow } from "./Rows/ProposalsVotedRow";
import { ForAgainstAbstainRow } from "./Rows/ForAgainstAbstainRow";
import { RecentActivityRow } from "./Rows/RecentActivityRow";
import { ProposalsCreatedRow } from "./Rows/ProposalsCreatedRow";
import { VoterPanelActions } from "./VoterPanelActions";
import { VotePowerRow } from "./Rows/VotePowerRow";
import { DelegateFromList } from "./Rows/DelegateFromListRow";
import { VoterPanelFragment$key } from "./__generated__/VoterPanelFragment.graphql";
import { NameSection } from "./NameSection";
import { TotalVotePowerRow } from "./Rows/TotalVotePowerRow";
import { DelegatedToListRow } from "./Rows/DelegatedToListRow";

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
