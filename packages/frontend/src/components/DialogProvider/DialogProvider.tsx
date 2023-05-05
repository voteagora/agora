import { css } from "@emotion/css";
import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useState,
} from "react";
import { Dialog } from "@headlessui/react";

import { inset0 } from "../../theme";
import { useStartTransition } from "../HammockRouter/HammockRouter";

import { dialogs, DialogType } from "./dialogs";

const context = createContext<Dispatch<
  SetStateAction<DialogTypeWithAutoClose | undefined>
> | null>(null);

type Props = {
  children: ReactNode;
};

type DialogTypeWithAutoClose = {
  dialogType: DialogType;
  autoClose: boolean;
};

export function DialogProvider({ children }: Props) {
  const startTransition = useStartTransition();
  const [contextValue, setContextValue] = useState<
    DialogTypeWithAutoClose | undefined
  >();

  const renderedDialog = (() => {
    if (!contextValue) {
      return;
    }

    const DialogComponent = dialogs[contextValue.dialogType.type] as any;
    return (
      <DialogComponent
        {...contextValue.dialogType.params}
        closeDialog={() => setContextValue(undefined)}
      />
    );
  })();

  return (
    <context.Provider
      value={(contextValue) =>
        startTransition(() => setContextValue(contextValue))
      }
    >
      <AnimatePresence>
        {!!renderedDialog && (
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
        open={!!renderedDialog}
        onClose={() => {
          if (contextValue?.autoClose) {
            setContextValue(undefined);
          }
        }}
        className={css`
          z-index: 10;
          position: fixed;
          ${inset0};
          display: flex;
          flex-direction: column;
          align-content: stretch;
          justify-content: center;
        `}
      >
        {renderedDialog}
      </Dialog>

      {children}
    </context.Provider>
  );
}

export function useDialogContext() {
  const dialogContext = useContext(context);

  if (!dialogContext) {
    throw new Error("missing DialogProvider in tree");
  }

  return dialogContext;
}

export function useOpenDialog() {
  const dialogContext = useDialogContext();

  return useCallback((dialogType: DialogType) => {
    dialogContext({ dialogType, autoClose: true });
  }, []);
}

export function useSetAutoCloseDialog() {
  const dialogContext = useDialogContext();

  return useCallback((autoClose: boolean) => {
    dialogContext((old) => {
      if (!old) {
        return undefined;
      }

      return {
        dialogType: old.dialogType,
        autoClose,
      };
    });
  }, []);
}
