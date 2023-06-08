import React from "react";

import type { SupportTextProps } from "../../pages/DelegatePage/VoteDetailsContainer";
import type {
  AvailableVotingPower,
  VotingAddress,
} from "../../pages/PropHouseAuctionPage/usePropHouseAvailableVotingPower";

import type { DialogDefinitions } from "./types";

export type DialogType =
  | DelegateDialogType
  | CastVoteDialogType
  | CastAuctionVoteDialogType;

export type DelegateDialogType = {
  type: "DELEGATE";
  params: {
    targetAccountAddress: string;
  };
};

// todo: just use props for argument types instead of explicit param drilling
// todo: lazy load the dialog compoment
// todo: prefetch the data for the dialog

export type CastVoteDialogType = {
  type: "CAST_VOTE";
  params: {
    address: string;
    proposalId: number;
    reason: string;
    supportType: SupportTextProps["supportType"];
    onVoteSuccess: () => void;
  };
};

export type CastAuctionVoteDialogType = {
  type: "CAST_AUCTION_VOTE";
  params: {
    address: string;
    auctionId: number;
    pendingVotes: Map<number, number>;
    votingPower: AvailableVotingPower[];
    votingAddresses: VotingAddress[];
  };
};

export const dialogs: DialogDefinitions<DialogType> = {
  DELEGATE: React.lazy(() => import("../DelegateDialog/DelegateDialog")),
  CAST_VOTE: React.lazy(
    () => import("../../pages/ProposalsPage/CastVoteDialog")
  ),
  CAST_AUCTION_VOTE: React.lazy(
    () => import("../../pages/PropHouseAuctionPage/AuctionCastVoteDialog")
  ),
};
