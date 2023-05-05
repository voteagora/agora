import { useLazyLoadQuery } from "react-relay/hooks";
import { graphql } from "react-relay";
import { useAccount } from "wagmi";
import { css } from "@emotion/css";
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { useCallback, useState } from "react";

import { VStack } from "../VStack";
import * as theme from "../../theme";
import { DelegateDialogType } from "../DialogProvider/dialogs";
import { DialogProps } from "../DialogProvider/types";

import { DelegateDialogQuery } from "./__generated__/DelegateDialogQuery.graphql";
import { ConfigureDelegationParameters } from "./pages/ConfigureDelegationParameters/ConfigureDelegationParameters";
import { LiquidDelegationAction, TokenDelegationAction } from "./action";
import { CommitMultiStepDelegation } from "./pages/CommitMultiStepDelegation/CommitMultiStepDelegation";

export default function DelegateDialog({
  targetAccountAddress,
  closeDialog: completeDelegation,
}: DialogProps<DelegateDialogType>) {
  return (
    <>
      <VStack
        alignItems="center"
        className={css`
          padding: ${theme.spacing["8"]};
        `}
      >
        <Dialog.Panel
          as={motion.div}
          initial={{
            scale: 0.9,
            translateY: theme.spacing["8"],
          }}
          animate={{ translateY: 0, scale: 1 }}
          className={css`
            width: 100%;
            max-width: ${theme.maxWidth.md};
            background: ${theme.colors.white};
            border-radius: ${theme.spacing["3"]};
            padding: ${theme.spacing["6"]};
          `}
        >
          <DelegateDialogContents
            targetAccountAddress={targetAccountAddress}
            completeDelegation={completeDelegation}
          />
        </Dialog.Panel>
      </VStack>
    </>
  );
}

type DelegateDialogState =
  | {
      type: "CONFIGURE";
    }
  | {
      type: "COMMIT_DELEGATION";
      liquidDelegation: LiquidDelegationAction;
      tokenDelegation: TokenDelegationAction;
    };

function DelegateDialogContents({
  targetAccountAddress,
  completeDelegation,
}: {
  targetAccountAddress: string;
  completeDelegation: () => void;
}) {
  const { address: accountAddress } = useAccount();
  const result = useLazyLoadQuery<DelegateDialogQuery>(
    graphql`
      query DelegateDialogQuery(
        $currentAccountAddress: String!
        $targetAccountAddress: String!
        $skip: Boolean!
      ) {
        ...ConfigureDelegationParametersFragment
          @arguments(
            currentAccountAddress: $currentAccountAddress
            targetAccountAddress: $targetAccountAddress
            skip: $skip
          )
      }
    `,
    {
      targetAccountAddress,
      currentAccountAddress: accountAddress ?? "",
      skip: !accountAddress,
    },
    {
      fetchPolicy: "network-only",
    }
  );

  const [state, setState] = useState<DelegateDialogState>(() => ({
    type: "CONFIGURE",
  }));

  const navigateDialog = useCallback((action: NavigateDialogAction) => {
    switch (action.type) {
      case "CLOSE": {
        completeDelegation();
        break;
      }

      case "DELEGATE": {
        setState({
          type: "COMMIT_DELEGATION",
          tokenDelegation: action.tokenDelegation,
          liquidDelegation: action.liquidDelegation,
        });
        break;
      }
    }
  }, []);

  switch (state.type) {
    case "CONFIGURE": {
      return (
        <ConfigureDelegationParameters
          fragmentRef={result}
          navigateDialog={navigateDialog}
        />
      );
    }

    case "COMMIT_DELEGATION": {
      return (
        <CommitMultiStepDelegation
          complete={() => navigateDialog({ type: "CLOSE" })}
          tokenDelegation={state.tokenDelegation}
          liquidDelegation={state.liquidDelegation}
        />
      );
    }
  }
}

export type NavigateDialogAction =
  | { type: "CLOSE" }
  | {
      type: "DELEGATE";
      tokenDelegation: TokenDelegationAction;
      liquidDelegation: LiquidDelegationAction;
    };
