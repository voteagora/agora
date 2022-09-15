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
import { useFragment, useMutation, VariablesOf } from "react-relay";
import { useMutation as useReactQueryMutation } from "@tanstack/react-query";
import graphql from "babel-plugin-relay/macro";
import {
  DelegateStatementFormMutation,
  ValueWithSignature,
} from "./__generated__/DelegateStatementFormMutation.graphql";
import { HStack, VStack } from "../../components/VStack";
import { DelegateStatementFormFragment$key } from "./__generated__/DelegateStatementFormFragment.graphql";
import { useEffect, useMemo } from "react";
import { isEqual } from "lodash";
import {
  BlockNavigationError,
  browserHistory,
  useNavigate,
} from "../../components/HammockRouter/HammockRouter";
import { Signer } from "ethers";

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
      @argumentDefinitions(address: { type: "String!" }) {
        address(addressOrEnsName: $address) {
          resolvedName {
            address
            name
          }

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

  const initialFormValuesState = useMemo((): FormValues => {
    if (!data.address?.wrappedDelegate?.statement) {
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
  }, [data]);

  const form = useForm<FormValues>(() => initialFormValuesState);

  const isDirty = useMemo(
    () => !isEqual(form.state, initialFormValuesState),
    [form.state, initialFormValuesState]
  );

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    return browserHistory.block((transition) => {
      if (currentlyIgnoringBlock) {
        return;
      }

      const allowedToProceed = window.confirm(
        "You have pending changes, are you sure you want to navigate?"
      );

      if (!allowedToProceed) {
        throw new BlockNavigationError();
      }
    });
  }, [isDirty]);

  const [createNewDelegateStatement, isMutationInFlight] =
    useMutation<DelegateStatementFormMutation>(
      graphql`
        mutation DelegateStatementFormMutation(
          $input: CreateNewDelegateStatementData
        ) {
          createNewDelegateStatement(data: $input) {
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
      `
    );

  const navigate = useNavigate();

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

    const variables: VariablesOf<DelegateStatementFormMutation> = {
      input: {
        statement: await makeSignedValue(signer, serializedBody),
        email: formState.email
          ? await makeSignedValue(signer, formState.email)
          : null,
      },
    };

    await new Promise<void>((resolve, reject) =>
      createNewDelegateStatement({
        variables,
        updater(store) {
          store.invalidateStore();
        },
        onCompleted() {
          resolve();
        },
        onError(error) {
          reject(error);
        },
      })
    );

    withIgnoringBlock(() => {
      if (!data.address) {
        return;
      }

      navigate({
        path: `/delegate/${
          data.address.resolvedName.name ?? data.address.resolvedName.address
        }`,
      });
    });
  });

  const canSubmit =
    !!signer && !isMutationInFlight && !submitMutation.isLoading && isDirty;

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
        gap="4"
        className={css`
          padding: ${theme.spacing["8"]} ${theme.spacing["6"]};
          flex-wrap: wrap;

          @media (max-width: ${theme.maxWidth.lg}) {
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-end;
          }
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
          Submit delegate profile
        </button>
      </HStack>
    </VStack>
  );
}

let currentlyIgnoringBlock = false;
function withIgnoringBlock(fn: () => void) {
  currentlyIgnoringBlock = true;
  try {
    fn();
  } finally {
    currentlyIgnoringBlock = false;
  }
}

async function makeSignedValue(
  signer: Signer,
  value: string
): Promise<ValueWithSignature> {
  return {
    value,
    signature: await signer.signMessage(value),
  };
}
