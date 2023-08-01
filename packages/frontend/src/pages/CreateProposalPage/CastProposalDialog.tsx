import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { css } from "@emotion/css";
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { icons } from "../../icons/icons";

type Props = {
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  txHash?: string;
  closeDialog: () => void;
};

export function CastProposalDialog({
  isError,
  isLoading,
  isSuccess,
  txHash,
}: Props) {
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
        <VStack
          gap="6"
          className={css`
            font-size: ${theme.fontSize["xs"]};
          `}
        >
          {!isError && !isLoading && !isSuccess && (
            <div>Waiting for transaction execution...</div>
          )}
          {txHash && !isLoading && !isSuccess && (
            <Message text="Transaction submitted and awaiting confirmation." />
          )}
          {isError && !txHash && <div>error</div>}
          {isLoading && <Loading />}
          {isSuccess && <SuccessMessage />}
        </VStack>
      </Dialog.Panel>
    </VStack>
  );
}

function Message({ text, image }: { text: string; image?: JSX.Element }) {
  return (
    <HStack
      justifyContent="space-between"
      alignItems="center"
      className={css`
        width: 100%;
        z-index: 1;
        position: relative;
        padding: ${theme.spacing["4"]};
        border-radius: ${theme.spacing["2"]};
        border: 1px solid ${theme.colors.gray.eb};
      `}
    >
      <div
        className={css`
          font-weight: ${theme.fontWeight.medium};
        `}
      >
        {text}
      </div>
      {image}
    </HStack>
  );
}

export function SuccessMessage() {
  return (
    <Message
      text="Success! Proposal has been cast. It will appear once the transaction is
    confirmed."
      image={
        <img
          src={icons.ballot}
          alt={icons.ballot}
          className={css`
            height: 20px;
          `}
        />
      }
    />
  );
}

export function Loading() {
  return (
    <Message
      text="Creating proposal"
      image={<img src={icons.spinner} alt={icons.spinner} />}
    />
  );
}
