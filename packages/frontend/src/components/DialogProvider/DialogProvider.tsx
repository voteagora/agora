import { css } from "@emotion/css";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, ReactNode, useContext, useState } from "react";
import { dialogs, DialogType } from "./dialogs";
import { inset0 } from "../../theme";
import { Dialog } from "@headlessui/react";

type OpenDialogFn = (dialog: DialogType | null) => void;

const context = createContext<OpenDialogFn | null>(null);

type Props = {
  children: ReactNode;
};

export function DialogProvider({ children }: Props) {
  const [contextValue, setContextValue] = useState<DialogType | null>();

  const renderedDialog = (() => {
    if (!contextValue) {
      return;
    }

    const dialog = dialogs[contextValue.type];
    return dialog(contextValue.params as any, () => setContextValue(null));
  })();

  return (
    <context.Provider value={(dialog) => setContextValue(dialog)}>
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

export function useOpenDialogOptional() {
  return useContext(context);
}
