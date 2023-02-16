import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { HStack } from "../../components/VStack";
import { NounResolvedName } from "../../components/NounResolvedName";
import { utils } from "ethers";
import { formatDistanceToNow } from "date-fns";
import {
  ActualProposalStatus,
  OnChainProposalRowFragment$key,
} from "./__generated__/OnChainProposalRowFragment.graphql";
import { OnChainProposalRowActivityFragment$key } from "./__generated__/OnChainProposalRowActivityFragment.graphql";
import { StatusText } from "./StatusText";
import { Row, RowValue } from "./Rows";

export function OnChainProposalRow({
  fragmentRef,
}: {
  fragmentRef: OnChainProposalRowFragment$key;
}) {
  const proposal = useFragment(
    graphql`
      fragment OnChainProposalRowFragment on Proposal {
        id
        number
        actualStatus
        title
        totalValue
        forVotes
        againstVotes
        abstainVotes
        totalVotes
        voteStartsAt
        voteEndsAt
        proposer {
          resolvedName {
            ...NounResolvedNameFragment
          }
        }

        ...OnChainProposalRowActivityFragment
      }
    `,
    fragmentRef
  );

  return (
    <Row path={`/proposals/${proposal.number}`}>
      <RowValue
        primary
        title={
          <>
            Prop {proposal.number} – by{" "}
            <NounResolvedName resolvedName={proposal.proposer.resolvedName} />
          </>
        }
      >
        {proposal.title}
      </RowValue>

      <RowValue title={"Status"}>
        <StatusText
          className={css`
            color: ${colorForOnChainProposalStatus(proposal.actualStatus)};
          `}
        >
          {proposal.actualStatus}
        </StatusText>
      </RowValue>

      <RowValue title={"Requesting"}>
        {parseFloat(utils.formatEther(proposal.totalValue)).toFixed(1)} ETH
      </RowValue>

      <Activity fragmentRef={proposal} />
    </Row>
  );
}

function Activity({
  fragmentRef,
}: {
  fragmentRef: OnChainProposalRowActivityFragment$key;
}) {
  const proposal = useFragment(
    graphql`
      fragment OnChainProposalRowActivityFragment on Proposal {
        voteEndsAt
        actualStatus
        voteStartsAt
        forVotes
        againstVotes
      }
    `,
    fragmentRef
  );

  const voteEndsAt = new Date(proposal.voteEndsAt * 1000);
  const voteStartsAt = new Date(proposal.voteStartsAt * 1000);

  return (
    <RowValue
      title={(() => {
        switch (proposal.actualStatus) {
          case "PENDING":
            return "Voting";

          case "ACTIVE":
            return `Voting ends in ${formatDistanceToNow(voteEndsAt)}`;

          default:
            return `Voting ended ${formatDistanceToNow(voteEndsAt)} ago`;
        }
      })()}
    >
      <HStack>
        {(() => {
          if (proposal.actualStatus === "PENDING") {
            return `Starts in ${formatDistanceToNow(new Date(voteStartsAt))}`;
          } else {
            return (
              <HStack gap="1">
                <span>{proposal.forVotes} For</span>

                <span
                  className={css`
                    color: ${theme.colors.gray[500]};
                  `}
                >
                  -
                </span>

                <span>{proposal.againstVotes} Against</span>
              </HStack>
            );
          }
        })()}
      </HStack>
    </RowValue>
  );
}

export function colorForOnChainProposalStatus(status: ActualProposalStatus) {
  switch (status) {
    case "DEFEATED":
    case "CANCELLED":
    case "VETOED":
    case "EXPIRED":
      return theme.colors.red[600];

    case "EXECUTED":
    case "QUEUED":
      return theme.colors.green[600];

    case "PENDING":
      return theme.colors.black;

    case "ACTIVE":
      return theme.colors.blue[600];

    default:
      throw new Error(`unknown status type ${status}`);
  }
}
