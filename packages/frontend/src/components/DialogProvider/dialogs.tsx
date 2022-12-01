import { DialogDefinitions } from "./types";
import { DelegateDialog } from "../DelegateDialog";
import { SupportTextProps } from "../../pages/DelegatePage/VoteDetailsContainer";
import { CastVoteDialog } from "../../pages/ProposalsPage/CastVoteDialog";

export type DialogType = DelegateDialogType | CastVoteDialogType;

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
};
