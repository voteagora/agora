import { ComponentType } from "react";

type DialogBaseType = { type: string; params: Record<string, any> };

export type DialogDefinitions<U extends DialogBaseType> = {
  [K in U as K["type"]]: ComponentType<DialogProps<K>>;
};

type BaseDialogType<T extends string, Params extends Record<string, any>> = {
  type: T;
  params: Params;
};

type ParamsFromDialogType<
  DialogType extends BaseDialogType<string, Record<string, any>>
> = DialogType extends BaseDialogType<string, infer Params> ? Params : never;

export type DialogProps<
  DialogType extends BaseDialogType<string, Record<string, any>>
> = ParamsFromDialogType<DialogType> & {
  closeDialog: () => void;
};
