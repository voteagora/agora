import { css, cx } from "@emotion/css";
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
import { useFragment, useMutation } from "react-relay";
import { useMutation as useReactQueryMutation } from "@tanstack/react-query";
import graphql from "babel-plugin-relay/macro";
import { DelegateStatementFormMutation } from "./__generated__/DelegateStatementFormMutation.graphql";
import { HStack, VStack } from "../../components/VStack";
import { DelegateStatementFormFragment$key } from "./__generated__/DelegateStatementFormFragment.graphql";

type DelegateStatementFormProps = {
  queryFragment: DelegateStatementFormFragment$key;
  className: string;
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
  className,
}: DelegateStatementFormProps) {
  const data = useFragment(
    graphql`
      fragment DelegateStatementFormFragment on Query
      @argumentDefinitions(address: { type: "ID!" }) {
        address(address: $address) {
          wrappedDelegate {
            statement {
              statement
              mostValuableProposals {
                number
              }

              leastValuableProposals {
                number
              }

              discord
              twitter
              topIssues {
                type
                value
              }

              openToSponsoringProposals
            }
          }
        }

        ...PastProposalsFormSectionProposalListFragment
      }
    `,
    queryFragment
  );

  const form = useForm<FormValues>(() => {
    if (!data.address.wrappedDelegate.statement) {
      return initialFormValues();
    }

    const statement = data.address.wrappedDelegate.statement;

    return {
      discord: statement.discord,
      twitter: statement.twitter,
      leastValuableProposals: statement.leastValuableProposals.slice(),
      mostValuableProposals: statement.mostValuableProposals.slice(),
      topIssues: statement.topIssues.slice(),
      delegateStatement: statement.statement,
      email: "",
      openToSponsoringProposals: (() => {
        if (statement.openToSponsoringProposals === null) {
          return undefined;
        }

        return statement.openToSponsoringProposals ? "yes" : "no";
      })(),
    };
  });

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
      mostValuableProposals: formState.mostValuableProposals,
      leastValuableProposals: formState.leastValuableProposals,
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
    <VStack
      className={cx(
        css`
          width: 100%;
          background-color: ${theme.colors.white};
          border-radius: ${theme.spacing["3"]};
          border-width: ${theme.spacing.px};
          border-color: ${theme.colors.gray["300"]};
          box-shadow: ${theme.boxShadow.newDefault};
        `,
        className
      )}
    >
      <DelegateStatementFormSection form={form} />
      <TopIssuesFormSection form={form} />
      <PastProposalsFormSection form={form} queryFragment={data} />
      <OtherInfoFormSection form={form} />

      <HStack
        justifyContent="space-between"
        alignItems="center"
        className={css`
          padding: ${theme.spacing["8"]} ${theme.spacing["6"]};
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
      </HStack>
    </VStack>
  );
}
