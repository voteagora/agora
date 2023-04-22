import { SupportTextProps } from "../../pages/DelegatePage/VoteDetailsContainer";
import { AuctionCastVoteDialog } from "../../pages/PropHouseAuctionPage/AuctionCastVoteDialog";
import {
  AvailableVotingPower,
  VotingAddress,
} from "../../pages/PropHouseAuctionPage/usePropHouseAvailableVotingPower";
import { CastVoteDialog } from "../../pages/ProposalsPage/CastVoteDialog";
import { DelegateDialog } from "../DelegateDialog/DelegateDialog";

import { DialogDefinitions } from "./types";

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
  DELEGATE: ({ targetAccountAddress }, closeDialog) => {
    return (
      <DelegateDialog
        targetAccountAddress={targetAccountAddress}
        completeDelegation={closeDialog}
      />
    );
  },
  CAST_VOTE: ({ ...props }, closeDialog) => {
    return <CastVoteDialog {...props} closeDialog={closeDialog} />;
  },
  CAST_AUCTION_VOTE: ({ ...props }, closeDialog) => {
    return <AuctionCastVoteDialog {...props} closeDialog={closeDialog} />;
  },
};
