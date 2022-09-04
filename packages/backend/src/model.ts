import { validateForm } from "./formSchema";

export type OverallMetrics = {};

export type Address = {
  address: string;
};

export type ResolvedName = {
  address: string;
};

export type WrappedDelegate = {
  address: string;

  underlyingDelegate?: any;
};

export type DelegateStatement = ReturnType<typeof validateForm>;
