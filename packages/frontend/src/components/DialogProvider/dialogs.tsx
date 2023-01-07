import { DialogDefinitions } from "./types";
import { DelegateDialog } from "../DelegateDialog";
import { SupportTextProps } from "../../pages/DelegatePage/VoteDetailsContainer";
import React from "react";
import { CastVoteDialog } from "../../pages/ProposalsPage/CastVoteDialog";

export type DialogType = DelegateDialogType | CastVoteDialogType;

export type DelegateDialogType = {
  type: "DELEGATE";
  params: {
    target: string;
  };
};

export type CastVoteDialogType = {
  type: "CAST_VOTE";
  params: {
    proposalId: string;
    reason: string;
    supportType: SupportTextProps["supportType"];
  };
};

export const dialogs: DialogDefinitions<DialogType> = {
  DELEGATE: ({ target }, closeDialog) => {
    return <DelegateDialog target={target} completeDelegation={closeDialog} />;
  },
  CAST_VOTE: ({ ...props }, closeDialog) => {
    return <CastVoteDialog {...props} closeDialog={closeDialog} />;
  },
};
