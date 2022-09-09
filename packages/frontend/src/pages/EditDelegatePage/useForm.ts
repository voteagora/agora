import { SetStateAction, useMemo, useState } from "react";

export type UseForm<T extends Record<string, any>> = {
  state: T;
  onChange: OnChangeForFormValues<T>;
};

export type OnChangeForFormValues<T extends Record<string, any>> = {
  [K in keyof T]: (action: SetStateAction<T[K]>) => void;
};

export function useForm<T extends Record<string, any>>(
  initialFormValuesFn: () => T
) {
  const [initialState] = useState(initialFormValuesFn);
  const [state, setState] = useState<T>(initialFormValuesFn);

  const onChange: OnChangeForFormValues<T> = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(initialState).map(function <K extends keyof T>(key: K) {
          return [
            key,
            (nextValueOrUpdater: SetStateAction<T[K]>) => {
              if (typeof nextValueOrUpdater === "function") {
                const updater: (arg: T[K]) => T[K] = nextValueOrUpdater;
                setState((prevState) => {
                  return { ...prevState, [key]: updater(prevState[key]) };
                });
              } else {
                const nextValue: T[K] = nextValueOrUpdater;
                setState((prevState) => {
                  return {
                    ...prevState,
                    [key]: nextValue,
                  };
                });
              }
            },
          ];
        })
      ),
    [initialState, setState]
  ) as any;

  return useMemo(
    () => ({
      state,
      onChange,
    }),
    [state, onChange]
  );
}
