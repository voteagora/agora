import { PastProposalsFormSectionProposalListFragment$key } from "./__generated__/PastProposalsFormSectionProposalListFragment.graphql";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import {
  DelegateStatementFormSection,
  tipTextStyle,
} from "./DelegateStatementFormSection";
import {
  initialTopIssues,
  IssueState,
  TopIssuesFormSection,
} from "./TopIssuesFormSection";
import {
  PastProposalsFormSection,
  SelectedProposal,
} from "./PastProposalsFormSection";
import { OtherInfoFormSection } from "./OtherInfoFormSection";
import { buttonStyles } from "./EditDelegatePage";
import { UseForm, useForm } from "./useForm";

type DelegateStatementFormProps = {
  queryFragment: PastProposalsFormSectionProposalListFragment$key;
};

type FormValues = {
  delegateStatement: string;
  topIssues: IssueState[];
  mostValuablePastProposals: SelectedProposal[];
  leastValuablePastProposals: SelectedProposal[];
  twitter: string;
  discord: string;
  email: string;
  openToSponsoringProposals: "yes" | "no" | undefined;
};

function initialFormValues(): FormValues {
  return {
    delegateStatement: "",
    topIssues: initialTopIssues(),
    mostValuablePastProposals: [],
    leastValuablePastProposals: [],
    twitter: "",
    discord: "",
    email: "",
    openToSponsoringProposals: undefined,
  };
}

export type Form = UseForm<FormValues>;

export function DelegateStatementForm({
  queryFragment,
}: DelegateStatementFormProps) {
  const form = useForm(initialFormValues);

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        width: 100%;

        background: ${theme.colors.white};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
        border-radius: ${theme.spacing["3"]};
        box-shadow: ${theme.boxShadow.md};
      `}
    >
      <DelegateStatementFormSection form={form} />
      <TopIssuesFormSection form={form} />
      <PastProposalsFormSection form={form} queryFragment={queryFragment} />
      <OtherInfoFormSection form={form} />

      <div
        className={css`
          padding: ${theme.spacing["8"]} ${theme.spacing["6"]};

          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        `}
      >
        <span className={tipTextStyle}>
          Tip: you can always come back and edit your profile at any time.
        </span>

        <button
          className={buttonStyles}
          onClick={() => console.log(form.state)}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
