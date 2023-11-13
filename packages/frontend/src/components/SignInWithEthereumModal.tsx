import { css } from "@emotion/css";
import { HStack, VStack } from "./VStack";
import * as theme from "../theme";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { useSIWE } from "connectkit";
import { icons } from "../icons/icons";
import { useEffect } from "react";

export function SignInWithEthereumModal({
  closeDialog,
}: {
  closeDialog: () => void;
}) {
  return (
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
          max-width: ${theme.maxWidth.xs};
          background: ${theme.colors.white};
          border-radius: ${theme.spacing["3"]};
          padding: ${theme.spacing["6"]};
        `}
      >
        <SignInWithEthereumModalContent closeDialog={closeDialog} />
      </Dialog.Panel>
    </VStack>
  );
}

function SignInWithEthereumModalContent({
  closeDialog,
}: {
  closeDialog: () => void;
}) {
  const { isSuccess, isLoading, signIn, isError } = useSIWE();

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        closeDialog();
      }, 1000);
    }
  }, [isSuccess, closeDialog]);

  return (
    <VStack>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: left;
          font-size: ${theme.fontSize["sm"]};
          font-weight: ${theme.fontWeight.medium};
          margin-bottom: ${theme.spacing["4"]};
        `}
      >
        Sign In With Ethereum
      </div>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: ${theme.fontSize.sm};
          font-weight: ${theme.fontWeight.light};
          margin-bottom: ${theme.spacing["4"]};
        `}
      >
        Agora would like to verify you as the owner of this wallet. Please sign
        the message request in your wallet to continue.
      </div>
      <button onClick={signIn} disabled={isSuccess || isLoading}>
        <HStack
          gap="2"
          className={css`
            display: flex;
            flex-direction: column;
            align-items: center;
            border-radius: ${theme.spacing["2"]};
            border: 1px solid ${theme.colors.gray.eb};
            font-size: ${theme.fontSize.sm};
            font-weight: ${theme.fontWeight.semibold};
            padding: ${theme.spacing["3"]} 0;
            cursor: pointer;
            :hover {
              background: ${theme.colors.gray.eb};
            }
          `}
        >
          <HStack gap="2">
            Sign In
            {isLoading && (
              <img
                src={icons.spinner}
                alt="spinner"
                className={css`
                  opacity: 1;
                `}
              />
            )}
            {isSuccess && (
              <img
                src={icons.check}
                alt="check"
                className={css`
                  opacity: 1;
                `}
              />
            )}
            {isError && (
              <img
                src={icons.close}
                alt="x"
                className={css`
                  opacity: 1;
                `}
              />
            )}
          </HStack>
        </HStack>
      </button>
    </VStack>
  );
}
