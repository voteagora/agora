import { DialogDefinitions } from "./types";
import { DelegateDialog } from "../DelegateDialog";

export type DialogType = DelegateDialogType;

export type DelegateDialogType = {
  type: "DELEGATE";
  params: {
    targetAccountAddress: string;
  };
};

export const dialogs: DialogDefinitions<DialogType> = {
  DELEGATE: ({ targetAccountAddress }, closeDialog) => {
    return (
      <DelegateDialog
        targetAccountAddress={targetAccountAddress}
        completeDelegation={closeDialog}
      />
    );
  },
};
