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
import { useSigner } from "wagmi";
import { useMutation } from "react-relay";
import { useMutation as useReactQueryMutation } from "@tanstack/react-query";
import graphql from "babel-plugin-relay/macro";
import { DelegateStatementFormMutation } from "./__generated__/DelegateStatementFormMutation.graphql";

type DelegateStatementFormProps = {
  queryFragment: PastProposalsFormSectionProposalListFragment$key;
};

type FormValues = {
  delegateStatement: string;
  topIssues: IssueState[];
  mostValuableProposals: SelectedProposal[];
  leastValuableProposals: SelectedProposal[];
  twitter: string;
  discord: string;
  email: string;
  openToSponsoringProposals: "yes" | "no" | undefined;
};

function initialFormValues(): FormValues {
  return {
    delegateStatement: "",
    topIssues: initialTopIssues(),
    mostValuableProposals: [],
    leastValuableProposals: [],
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

  const [createNewDelegateStatement, isMutationInFlight] =
    useMutation<DelegateStatementFormMutation>(
      graphql`
        mutation DelegateStatementFormMutation(
          $input: CreateNewDelegateStatementData
        ) {
          createNewDelegateStatement(data: $input) {
            id
          }
        }
      `
    );

  const { data: signer } = useSigner();
  const submitMutation = useReactQueryMutation(["submit"], async () => {
    if (!signer) {
      return;
    }

    const formState = form.state;
    const signingBody = {
      for: "nouns-agora",
      delegateStatement: formState.delegateStatement,
      topIssues: formState.topIssues,
      mostValuablePastProposals: formState.mostValuableProposals,
      leastValuablePastProposals: formState.leastValuableProposals,
      twitter: formState.twitter,
      discord: formState.discord,
      openToSponsoringProposals: formState.openToSponsoringProposals ?? null,
    };
    const serializedBody = JSON.stringify(signingBody, undefined, "\t");

    const signature = await signer.signMessage(serializedBody);

    createNewDelegateStatement({
      variables: {
        input: {
          statementBodyJson: serializedBody,
          statementBodyJsonSignature: signature,
        },
      },
    });
  });

  const canSubmit =
    !!signer && !isMutationInFlight && !submitMutation.isLoading;

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
          disabled={!canSubmit}
          onClick={() => submitMutation.mutate()}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
