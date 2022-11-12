import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VStack } from "../VStack";
import { ProposalsVotedRow } from "./Rows/ProposalsVotedRow";
import { ForAgainstAbstainRow } from "./Rows/ForAgainstAbstainRow";
import { RecentActivityRow } from "./Rows/RecentActivityRow";
import { ProposalsCreatedRow } from "./Rows/ProposalsCreatedRow";
import { VoterPanelActions } from "./VoterPanelActions";
import { VotePowerRow } from "./Rows/VotePowerRow";
import { DelegateFromList } from "./Rows/DelegateFromListRow";
import { DelegateProfileImage } from "../DelegateProfileImage";
import { VoterPanelFragment$key } from "./__generated__/VoterPanelFragment.graphql";

type Props = {
  fragment: VoterPanelFragment$key;
};

export function VoterPanel({ fragment }: Props) {
  const delegate = useFragment(
    graphql`
      fragment VoterPanelFragment on Delegate {
        delegateMetrics {
          ...DelegateFromListRowFragment
          ...ProposalsCreatedRowFragment
          ...RecentActivityRowFragment
        }

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
        alignItems="stretch"
        className={css`
          padding: ${theme.spacing["6"]};
          border-bottom: ${theme.spacing.px} solid ${theme.colors.gray["300"]};
        `}
      >
        <DelegateProfileImage fragment={delegate} />
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
          <ProposalsVotedRow fragment={delegate} />

          <ForAgainstAbstainRow fragment={delegate} />

          <VotePowerRow fragment={delegate} />

          <RecentActivityRow fragment={delegate.delegateMetrics} />

          <ProposalsCreatedRow fragment={delegate.delegateMetrics} />

          <DelegateFromList fragment={delegate.delegateMetrics} />

          <VoterPanelActions fragment={delegate} />
        </VStack>
      </div>
    </VStack>
  );
}
