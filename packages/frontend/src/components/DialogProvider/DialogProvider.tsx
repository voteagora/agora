import { css } from "@emotion/css";
import { Dialog } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, ReactNode, useContext, useState } from "react";

import { inset0 } from "../../theme";
import { useStartTransition } from "../HammockRouter/HammockRouter";

import { dialogs, DialogType } from "./dialogs";

type OpenDialogFn = (dialog: DialogType) => void;

const context = createContext<OpenDialogFn | null>(null);

type Props = {
  children: ReactNode;
};

export function DialogProvider({ children }: Props) {
  const startTransition = useStartTransition();
  const [contextValue, setContextValue] = useState<DialogType | null>();

  const renderedDialog = (() => {
    if (!contextValue) {
      return;
    }

    const dialog = dialogs[contextValue.type];
    return dialog(contextValue.params as any, () => setContextValue(null));
  })();

  return (
    <context.Provider
      value={(dialog) => startTransition(() => setContextValue(dialog))}
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
        onClose={() => setContextValue(null)}
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

export function useOpenDialog() {
  const openDialog = useContext(context);

  if (!openDialog) {
    throw new Error("missing DialogProvider in tree");
  }

  return openDialog;
}
