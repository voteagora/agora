import { css } from "@emotion/css";
import graphql from "babel-plugin-relay/macro";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import { useFragment } from "react-relay";

import * as theme from "../../theme";

import { colorForOnChainProposalStatus } from "./OnChainProposalRow";
import { Row, RowValue } from "./Rows";
import { StatusText } from "./StatusText";
import { PropHouseAuctionRowActivityFragment$key } from "./__generated__/PropHouseAuctionRowActivityFragment.graphql";
import { PropHouseAuctionRowFragment$key } from "./__generated__/PropHouseAuctionRowFragment.graphql";
import { PropHouseAuctionStatus } from "./__generated__/useProposalsInnerFragment.graphql";

export function PropHouseAuctionRow({
  fragmentRef,
}: {
  fragmentRef: PropHouseAuctionRowFragment$key;
}) {
  const auction = useFragment(
    graphql`
      fragment PropHouseAuctionRowFragment on PropHouseAuction {
        number
        title
        status
        startTime
        votingEndTime
        fundingAmount
        currencyType
        numWinners
        proposalEndTime
        numProposals

        ...PropHouseAuctionRowActivityFragment
      }
    `,
    fragmentRef
  );

  return (
    <Row path={`/auctions/${auction.number}`}>
      <RowValue primary title={`Prop House Round`}>
        {auction.title}
      </RowValue>

      <RowValue title={`Status`}>
        <StatusText
          className={css`
            color: ${colorForPropHouseAuctionStatus(auction.status)};
          `}
        >
          {auction.status}
        </StatusText>
      </RowValue>

      <RowValue title={`Funding`}>
        {`${auction.fundingAmount} ${auction.currencyType} x ${auction.numWinners}`}
      </RowValue>

      <PropHouseProposalActivity fragmentRef={auction} />
    </Row>
  );
}

function PropHouseProposalActivity({
  fragmentRef,
}: {
  fragmentRef: PropHouseAuctionRowActivityFragment$key;
}) {
  const round = useFragment(
    graphql`
      fragment PropHouseAuctionRowActivityFragment on PropHouseAuction {
        status
        numProposals
        proposalEndTime
        votingEndTime
        startTime
      }
    `,
    fragmentRef
  );

  return (
    <RowValue
      title={(() => {
        switch (round.status) {
          case "PENDING":
            return "Proposing";

          case "PROPOSING":
            return `Proposing ends in ${formatDistanceToNow(
              new Date(round.proposalEndTime)
            )}`;

          case "EXECUTED":
            return `Voting ended ${formatDistanceToNow(
              new Date(round.votingEndTime)
            )}`;
        }
      })()}
    >
      {(() => {
        switch (round.status) {
          case "PENDING":
            return `Starts in ${formatDistanceToNow(
              new Date(round.startTime)
            )}`;

          default:
            return `${round.numProposals} Proposals`;
        }
      })()}
    </RowValue>
  );
}

export function colorForPropHouseAuctionStatus(status: PropHouseAuctionStatus) {
  switch (status) {
    case "PROPOSING": {
      return theme.colors.purple[500];
    }

    case "ACTIVE":
    case "EXECUTED":
    case "PENDING": {
      return colorForOnChainProposalStatus(status);
    }

    default:
      throw new Error(`unknown value ${status}`);
  }
}
