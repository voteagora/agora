import { css, cx } from "@emotion/css";
import { useAccount, useProvider, useSigner } from "wagmi";
import { useFragment, useMutation, VariablesOf, graphql } from "react-relay";
import { useMutation as useReactQueryMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import isEqual from "lodash/isEqual";
import { BigNumber, ethers, Signer } from "ethers";
import * as Sentry from "@sentry/react";
import { GnosisSafe__factory } from "@agora/common/src/contracts/generated";
import { checkSafeSignature, hashEnvelopeValue } from "@agora/common";

import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import {
  BlockNavigationError,
  browserHistory,
  useNavigate,
} from "../../components/HammockRouter/HammockRouter";

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
import {
  DelegateStatementFormMutation,
  ValueWithSignature,
} from "./__generated__/DelegateStatementFormMutation.graphql";
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
  const { address } = useAccount();
  const provider = useProvider();

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
              number
            }

            leastValuableProposals {
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

        ...PastProposalsFormSectionProposalListFragment
      }
    `,
    queryFragment
  );

  const delegate = data.delegate;

  const initialFormValuesState = useMemo((): FormValues => {
    if (!delegate.statement) {
      return initialFormValues();
    }

    const statement = delegate.statement;

    return {
      discord: statement.discord,
      twitter: statement.twitter,
      leastValuableProposals: statement.leastValuableProposals.map((it) => ({
        number: BigNumber.from(it.number).toNumber(),
      })),
      mostValuableProposals: statement.mostValuableProposals.map((it) => ({
        number: BigNumber.from(it.number).toNumber(),
      })),
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
  }, [delegate]);

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

  const { data: signer } = useSigner();
  const submitMutation = useReactQueryMutation<
    unknown,
    unknown,
    { values: FormValues; address?: string }
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
      if (!signer) {
        throw new Error("signer not available");
      }

      if (!address) {
        throw new Error("address not available");
      }

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
          statement: await makeSignedValue(
            signer,
            provider,
            address,
            serializedBody
          ),
          email: formState.email
            ? await makeSignedValue(signer, provider, address, formState.email)
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
        if (!delegate.address) {
          return;
        }

        navigate({
          path: `/delegate/${
            delegate.address.resolvedName.name ??
            delegate.address.resolvedName.address
          }`,
        });
      });
    },
  });

  const canSubmit =
    !!signer && !isMutationInFlight && !submitMutation.isLoading && isDirty;

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

      {delegate.address.isContract && (
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
  provider: ethers.providers.Provider,
  signerAddress: string,
  value: string
): Promise<ValueWithSignature> {
  const signaturePayload = hashEnvelopeValue(value);

  const addressCode = await provider.getCode(signerAddress);
  if (addressCode === "0x") {
    // eoa account
    return {
      signerAddress,
      value,
      signature: await signer.signMessage(signaturePayload),
    };
  }

  // some kind of multi-sig wallet, likely a gnosis safe.
  const gnosisSafe = GnosisSafe__factory.connect(signerAddress, provider);
  const isSigned = await checkSafeSignature(gnosisSafe, signaturePayload);
  if (isSigned) {
    // already signed, post to backend
    return {
      signerAddress,
      value,
      signature: "0x",
    };
  }

  await signer.signMessage(signaturePayload);
  throw new UserVisibleError(
    "click submit again once all signatures have been provided, leaving this page will cause form values to be lost"
  );
}

class UserVisibleError extends Error {
  public readonly message: string;
  constructor(message: string) {
    super();
    this.message = message;
  }
}
