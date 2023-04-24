import { useLazyLoadQuery } from "react-relay/hooks";
import { graphql } from "react-relay";
import { useAccount } from "wagmi";
import { css } from "@emotion/css";
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";

import { VStack } from "../VStack";
import * as theme from "../../theme";
import { DelegateDialogType } from "../DialogProvider/dialogs";
import { DialogProps } from "../DialogProvider/types";

import { DelegationDisplay } from "./DelegationDisplay";
import { CommitDelegation } from "./CommitDelegation";
import { DelegateDialogQuery } from "./__generated__/DelegateDialogQuery.graphql";

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
        ...DelegationDisplayFragment
          @arguments(
            currentAccountAddress: $currentAccountAddress
            targetAccountAddress: $targetAccountAddress
            skip: $skip
          )
        ...CommitDelegationFragment
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
    }
  );

  return (
    <VStack gap="8" alignItems="stretch">
      <DelegationDisplay fragmentRef={result} />
      <CommitDelegation
        fragmentRef={result}
        completeDelegation={() => completeDelegation()}
      />
    </VStack>
  );
}
