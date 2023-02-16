import { DialogDefinitions } from "./types";
import { DelegateDialog } from "../DelegateDialog";
import { SupportTextProps } from "../../pages/DelegatePage/VoteDetailsContainer";
import { CastVoteDialog } from "../../pages/ProposalsPage/CastVoteDialog";
import { AuctionCastVoteDialog } from "../../pages/PropHouseAuctionPage/AuctionCastVoteDialog";

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
    pendingVotes: Record<number, number>;
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
