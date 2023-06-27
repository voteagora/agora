import { DialogDefinitions } from "./types";
import { DelegateDialog } from "../DelegateDialog";
import { FaqDialog } from "../../pages/HomePage/FaqDialog";
import { SupportTextProps } from "../../pages/DelegatePage/VoteDetailsContainer";
import { CastVoteDialog } from "../../pages/ProposalsPage/CastVoteDialog";
import { ApprovalCastVoteDialog } from "../../pages/ProposalsPage/ApprovalProposal/ApprovalCastVoteDialog";
import { ApprovalCastVoteDialogFragment$key } from "../../pages/ProposalsPage/ApprovalProposal/__generated__/ApprovalCastVoteDialogFragment.graphql";
import { TokenAmountDisplayFragment$key } from "../__generated__/TokenAmountDisplayFragment.graphql";
import { CastProposalDialog } from "../../pages/CreateProposalPage/CastProposalDialog";

export type DialogType =
  | DelegateDialogType
  | CastVoteDialogType
  | ApprovalCastVoteDialogType
  | FaqDialogType
  | CastProposalDialogType;

export type DelegateDialogType = {
  type: "DELEGATE";
  params: {
    target: string;
  };
};

export type FaqDialogType = {
  type: "FAQ";
  params: {};
};

export type CastVoteDialogType = {
  type: "CAST_VOTE";
  params: {
    proposalId: string;
    reason: string;
    supportType: SupportTextProps["supportType"];
  };
};

export type ApprovalCastVoteDialogType = {
  type: "APPROVAL_CAST_VOTE";
  params: {
    castVoteFragmentRef: ApprovalCastVoteDialogFragment$key;
    proposalId: string;
    hasStatement: boolean;
    votesRepresentedRef: TokenAmountDisplayFragment$key;
  };
};

export type CastProposalDialogType = {
  type: "CAST_PROPOSAL";
  params: {
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    txHash?: string;
  };
};

export const dialogs: DialogDefinitions<DialogType> = {
  DELEGATE: ({ target }, closeDialog) => {
    return <DelegateDialog target={target} completeDelegation={closeDialog} />;
  },
  CAST_VOTE: ({ ...props }, closeDialog) => {
    return <CastVoteDialog {...props} closeDialog={closeDialog} />;
  },
  APPROVAL_CAST_VOTE: ({ ...props }, closeDialog) => {
    return <ApprovalCastVoteDialog {...props} closeDialog={closeDialog} />;
  },
  FAQ: () => {
    return <FaqDialog />;
  },
  CAST_PROPOSAL: ({ ...props }, closeDialog) => {
    return <CastProposalDialog {...props} closeDialog={closeDialog} />;
  },
};
