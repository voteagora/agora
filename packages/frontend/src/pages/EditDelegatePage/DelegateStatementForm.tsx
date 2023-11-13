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
import { SelectedProposal } from "./PastProposalsFormSection";
import { OtherInfoFormSection } from "./OtherInfoFormSection";
import { buttonStyles } from "./EditDelegatePage";
import { UseForm, useForm } from "./useForm";
import { useAccount, useWalletClient, useSignMessage } from "wagmi";
import { recoverMessageAddress } from "viem";
import { useFragment, useMutation, VariablesOf } from "react-relay";
import { useMutation as useReactQueryMutation } from "@tanstack/react-query";
import graphql from "babel-plugin-relay/macro";
import { DelegateStatementFormMutation } from "./__generated__/DelegateStatementFormMutation.graphql";
import { HStack, VStack } from "../../components/VStack";
import { DelegateStatementFormFragment$key } from "./__generated__/DelegateStatementFormFragment.graphql";
import { useMemo, useState } from "react";
import { isEqual } from "lodash";
import { useNavigate } from "../../components/HammockRouter/HammockRouter";
import * as Sentry from "@sentry/react";

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
  // todo: change this field name
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
  const { address } = useAccount();

  const data = useFragment(
    graphql`
      fragment DelegateStatementFormFragment on Query
      @argumentDefinitions(address: { type: "String!" }) {
        delegate(addressOrEnsName: $address) {
          address {
            isContract
            resolvedName {
              address
              name
            }
          }

          statement {
            statement
            mostValuableProposals {
              # eslint-disable-next-line relay/unused-fields
              number
            }

            leastValuableProposals {
              # eslint-disable-next-line relay/unused-fields
              number
            }

            discord
            twitter
            topIssues {
              # eslint-disable-next-line relay/unused-fields
              type
              # eslint-disable-next-line relay/unused-fields
              value
            }

            openToSponsoringProposals
          }
        }
      }
    `,
    queryFragment
  );

  const initialFormValuesState = useMemo((): FormValues => {
    if (!data.delegate?.statement) {
      return initialFormValues();
    }

    const statement = data.delegate.statement;

    return {
      discord: statement.discord,
      twitter: statement.twitter,
      // @ts-ignore
      leastValuableProposals: statement.leastValuableProposals.slice(),
      // @ts-ignore
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

  const [createNewDelegateStatement, isMutationInFlight] =
    useMutation<DelegateStatementFormMutation>(
      graphql`
        mutation DelegateStatementFormMutation(
          $input: CreateNewDelegateStatementData!
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
  const [lastErrorMessage, setLastErrorMessage] = useState<string>();

  const messageSigner = useSignMessage();

  const walletClient = useWalletClient();
  const submitMutation = useReactQueryMutation<
    unknown,
    unknown,
    { values: FormValues; address?: `0x${string}` }
  >({
    mutationKey: ["submit"],
    onError: (error, variables) => {
      if (error instanceof UserVisibleError) {
        setLastErrorMessage(error.message);
        return;
      }

      const exceptionId = Sentry.captureException(error, {
        extra: {
          variables: JSON.stringify(variables),
        },
      });
      setLastErrorMessage(`An error occurred, id: ${exceptionId}`);
    },
    async mutationFn({ values: formState, address }) {
      if (!walletClient) {
        throw new Error("signer not available");
      }

      if (!address) {
        throw new Error("address not available");
      }

      const signingBody = {
        for: "optimism-agora",
        delegateStatement: formState.delegateStatement,
        topIssues: formState.topIssues,
        mostValuableProposals: formState.mostValuableProposals,
        leastValuableProposals: formState.leastValuableProposals,
        twitter: formState.twitter,
        discord: formState.discord,
        openToSponsoringProposals: formState.openToSponsoringProposals ?? null,
      };

      if (formState.openToSponsoringProposals !== "yes") {
        throw new UserVisibleError(
          "You must agree with the code of conduct to continue"
        );
      }

      const serializedBody = JSON.stringify(signingBody, undefined, "\t");

      const signature = await messageSigner.signMessageAsync({
        message: serializedBody,
      });

      const recoveredAddress = await recoverMessageAddress({
        message: serializedBody,
        signature: signature,
      });

      if ((recoveredAddress && signature) || messageSigner.data) {
        const variables: VariablesOf<DelegateStatementFormMutation> = {
          input: {
            statement: {
              signature,
              signatureType: recoveredAddress === address ? "EOA" : "CONTRACT",
              signerAddress: recoveredAddress,
              value: serializedBody,
            },
            email: formState.email
              ? {
                  signature: await messageSigner.signMessageAsync({
                    message: formState.email,
                  }),
                  signatureType:
                    recoveredAddress === address ? "EOA" : "CONTRACT",
                  signerAddress: address,
                  value: formState.email,
                }
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

        if (!data.delegate) {
          return;
        }

        navigate({
          path: `/delegate/${
            data.delegate.address.resolvedName.name ??
            data.delegate.address.resolvedName.address
          }`,
        });
      }
    },
  });

  const canSubmit =
    !!walletClient &&
    !isMutationInFlight &&
    !submitMutation.isLoading &&
    isDirty;

  return (
    <VStack
      className={cx(
        css`
          width: 100%;
        `,
        className
      )}
    >
      <VStack
        className={cx(
          css`
            ${containerStyle};
          `
        )}
      >
        <DelegateStatementFormSection form={form} />
        <TopIssuesFormSection form={form} />
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
            onClick={() =>
              submitMutation.mutate({
                values: form.state,
                address,
              })
            }
          >
            Submit delegate profile
          </button>
          {lastErrorMessage && (
            <span
              className={css`
                ${tipTextStyle};
                color: ${theme.colors.red["700"]};
              `}
            >
              {lastErrorMessage}
            </span>
          )}
        </HStack>
      </VStack>

      {data?.delegate?.address?.isContract && (
        <VStack
          className={css`
            margin: ${theme.spacing["6"]} 0;
            padding: ${theme.spacing["8"]} ${theme.spacing["6"]};

            ${containerStyle};
          `}
        >
          <span
            className={css`
              font-size: ${theme.fontSize.sm};
            `}
          >
            Instructions to sign with a Gnosis Safe wallet
          </span>
          <VStack
            className={css`
              color: #66676b;
              font-size: ${theme.fontSize.xs};
            `}
          >
            <span>1. Submit a delegate statement</span>
            <span>
              2. Wait for all required signers to approve the Safe transaction
            </span>
            <span>
              3. Resubmit the delegate statement. It will confirm without
              requiring approvals since it has already been signed.
            </span>
          </VStack>
        </VStack>
      )}
    </VStack>
  );
}

const containerStyle = css`
  background-color: ${theme.colors.white};
  border-radius: ${theme.spacing["3"]};
  border-width: ${theme.spacing.px};
  border-color: ${theme.colors.gray["300"]};
  box-shadow: ${theme.boxShadow.newDefault};
`;

class UserVisibleError extends Error {
  public readonly message: string;
  constructor(message: string) {
    super();
    this.message = message;
  }
}
