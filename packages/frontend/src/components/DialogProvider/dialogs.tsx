import { DialogDefinitions } from "./types";
import { DelegateDialog } from "../DelegateDialog";

export type DialogType = DelegateDialogType;

export type DelegateDialogType = {
  type: "DELEGATE";
  params: {
    target: string;
  };
};

export const dialogs: DialogDefinitions<DialogType> = {
  DELEGATE: ({ target }, closeDialog) => {
    return <DelegateDialog target={target} completeDelegation={closeDialog} />;
  },
};
