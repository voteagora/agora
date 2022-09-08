import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { inset0 } from "../theme";
import * as theme from "../theme";
import { HStack, VStack } from "./VStack";
import { NounGridChildren } from "./NounGrid";
import { NounResolvedName } from "./NounResolvedName";
import { shadow } from "../pages/DelegatePage/VoterPanel";
import { useAccount } from "wagmi";
import { ArrowDownIcon } from "@heroicons/react/20/solid";
import { css } from "@emotion/css";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { DelegateDialogQuery } from "./__generated__/DelegateDialogQuery.graphql";
import { DelegateDialogFragment$key } from "./__generated__/DelegateDialogFragment.graphql";
import { NounGridFragment$data } from "./__generated__/NounGridFragment.graphql";

export function DelegateDialog({
  fragment,
  isOpen,
  closeDialog,
}: {
  fragment: DelegateDialogFragment$key;
  isOpen: boolean;
  closeDialog: () => void;
}) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className={css`
              z-index: 10;
              background: black;
              position: fixed;
              ${inset0};
            `}
          />
        )}
      </AnimatePresence>

      <Dialog
        open={isOpen}
        onClose={closeDialog}
        className={css`
          z-index: 10;
          position: fixed;
          ${inset0};

          box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.16),
            0px 2px 2px rgba(0, 0, 0, 0.08);

          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        <Dialog.Panel
          className={css`
            width: 100%;
            max-width: ${theme.maxWidth.md};
            background: ${theme.colors.white};
            border-radius: ${theme.spacing["3"]};
            padding: ${theme.spacing["6"]};
          `}
        >
          <DelegateDialogContents fragment={fragment} />
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

function DelegateDialogContents({
  fragment,
}: {
  fragment: DelegateDialogFragment$key;
}) {
  const { address: accountAddress } = useAccount();
  const { address } = useLazyLoadQuery<DelegateDialogQuery>(
    graphql`
      query DelegateDialogQuery($address: ID!, $skip: Boolean!) {
        address(address: $address) @skip(if: $skip) {
          account {
            nouns {
              id
              ...NounImageFragment
            }
          }
        }
      }
    `,
    {
      address: accountAddress ?? "",
      skip: !accountAddress,
    }
  );

  const wrappedDelegate = useFragment(
    graphql`
      fragment DelegateDialogFragment on WrappedDelegate {
        address {
          resolvedName {
            address
            ...NounResolvedNameFragment
          }
        }

        delegate {
          nounsRepresented {
            id
            ...NounImageFragment
          }
        }
      }
    `,
    fragment
  );

  return (
    <VStack gap="8" alignItems="stretch">
      <VStack
        gap="3"
        alignItems="center"
        className={css`
          padding-top: ${theme.spacing["3"]};
          padding-bottom: ${theme.spacing["3"]};
          border-radius: ${theme.spacing["2"]};
          background: rgba(250, 250, 250, 0.95);
          border: 1px solid ${theme.colors.gray.eb};

          color: #66676b;
          font-size: ${theme.fontSize.xs};
        `}
      >
        <Dialog.Title>Delegating your nouns</Dialog.Title>

        <NounsDisplay nouns={address?.account?.nouns ?? []} />

        <VStack
          className={css`
            width: 100%;
            z-index: 1;
            position: relative;
          `}
          alignItems="center"
        >
          <VStack
            justifyContent="center"
            className={css`
              position: absolute;
              ${inset0};
              z-index: -1;
            `}
          >
            <div
              className={css`
                height: 1px;
                background: ${theme.colors.gray.eb};
              `}
            />
          </VStack>

          <VStack
            className={css`
              width: ${theme.spacing["10"]};
              height: ${theme.spacing["10"]};
              background: ${theme.colors.white};
              border: 1px solid ${theme.colors.gray.eb};
              border-radius: ${theme.borderRadius.full};
              padding: ${theme.spacing["2"]};
              box-shadow: ${shadow};
            `}
          >
            <ArrowDownIcon
              className={css`
                color: black;
              `}
            />
          </VStack>
        </VStack>

        <NounsDisplay
          nouns={wrappedDelegate.delegate?.nounsRepresented ?? []}
        />

        <NounResolvedName resolvedName={wrappedDelegate.address.resolvedName} />
      </VStack>

      <a
        href={`https://nouns.wtf/delegate?to=${wrappedDelegate.address.resolvedName.address}`}
        className={css`
          text-align: center;
          border-radius: ${theme.spacing["2"]};
          border: 1px solid ${theme.colors.gray.eb};
          font-weight: ${theme.fontWeight.semibold};
          padding: ${theme.spacing["4"]} 0;

          :hover {
            background: ${theme.colors.gray.eb};
          }
        `}
      >
        Delegate 3 votes
      </a>
    </VStack>
  );
}

type NounsDisplayProps = {
  nouns: NounGridFragment$data["nounsRepresented"];
};

function NounsDisplay({ nouns }: NounsDisplayProps) {
  const columns = 6;
  const imageSize = "8";
  const gapSize = "2";

  return (
    <HStack
      justifyContent="center"
      gap={gapSize}
      className={css`
        max-width: calc(
          ${theme.spacing[imageSize]} * ${columns} + ${theme.spacing[gapSize]} *
            ${columns - 1}
        );
        flex-wrap: wrap;
      `}
    >
      <NounGridChildren
        count={Infinity}
        nouns={nouns}
        imageSize={imageSize}
        overflowFontSize="base"
      />
    </HStack>
  );
}
