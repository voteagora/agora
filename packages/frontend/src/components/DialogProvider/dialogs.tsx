import { DialogDefinitions } from "./types";
import { DelegateDialog } from "../DelegateDialog";
import { FaqDialog } from "../../pages/HomePage/FaqDialog";
import { SupportTextProps } from "../../pages/DelegatePage/VoteDetailsContainer";
import { CastVoteDialog } from "../../pages/ProposalsPage/CastVoteDialog";
import { ApprovalCastVoteDialog } from "../../pages/ProposalsPage/ApprovalProposal/ApprovalCastVoteDialog";
import { ApprovalCastVoteDialogFragment$key } from "../../pages/ProposalsPage/ApprovalProposal/__generated__/ApprovalCastVoteDialogFragment.graphql";
import { TokenAmountDisplayFragment$key } from "../__generated__/TokenAmountDisplayFragment.graphql";
import { CastProposalDialog } from "../../pages/CreateProposalPage/CastProposalDialog";
import {
  RetroPGFAddToBallotModal,
  RetroPGFStep,
} from "../../pages/RetroPGFPage/BallotModal/RetroPGFAddToBallotModal";
import { RetroPGFAddListToBallotModalContentFragment$key } from "../../pages/RetroPGFPage/BallotModal/__generated__/RetroPGFAddListToBallotModalContentFragment.graphql";
import { RetroPGFAddProjectToBallotModalContentFragment$key } from "../../pages/RetroPGFPage/BallotModal/__generated__/RetroPGFAddProjectToBallotModalContentFragment.graphql";
import { SignInWithEthereumModal } from "../SignInWithEthereumModal";

export type DialogType =
  | DelegateDialogType
  | CastVoteDialogType
  | ApprovalCastVoteDialogType
  | FaqDialogType
  | CastProposalDialogType
  | RPGFDialogType
  | SignInWithEthereumModalType;

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

export type RPGFDialogType = {
  type: "RPGF";
  params: {
    listFragmentRef?: RetroPGFAddListToBallotModalContentFragment$key;
    projectFragmentRef?: RetroPGFAddProjectToBallotModalContentFragment$key;
    step: RetroPGFStep;
  };
};

export type SignInWithEthereumModalType = {
  type: "SIGN_IN_WITH_ETHEREUM";
  params: {};
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
  RPGF: ({ ...props }, closeDialog) => {
    return <RetroPGFAddToBallotModal {...props} closeDialog={closeDialog} />;
  },
  SIGN_IN_WITH_ETHEREUM: ({ ...props }, closeDialog) => {
    return <SignInWithEthereumModal {...props} closeDialog={closeDialog} />;
  },
};
