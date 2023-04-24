import { Abi, AbiEvent, AbiParameter } from "abitype";

import { Prettify } from "../../utils/unionToIntersection";

type StripEventInputNamesFromAbi<TAbi extends Abi> = {
  [K in keyof TAbi]: TAbi[K] extends AbiEvent
    ? StripEventInputNames<TAbi[K]>
    : TAbi[K];
};

/**
 * Strip parameter names for events in an ABI. Used for ensuring indexers
 * built against an interface can accept contract instances with ABIs with
 * event arguments with different names.
 *
 * This complicates the usage (no more name based access, only positional) in
 * exchange for compatibility. An unfortunate effect of this is that all
 * parameter access in indexers ends up being positional instead of name based.
 */
export function stripEventInputNamesFromAbi<TAbi extends Abi>(
  abi: TAbi
): StripEventInputNamesFromAbi<TAbi> {
  return abi.map((it) => {
    if (it.type !== "event") {
      return it;
    }

    return stripInputNames(it);
  }) as any;
}

export type StripEventInputNames<TAbiEvent extends AbiEvent> = Omit<
  TAbiEvent,
  "inputs"
> & {
  inputs: StripParameterNames<TAbiEvent["inputs"]>;
};

/**
 * Strips parameter names from the parameters for a single event.
 *
 * Related:
 * * {@link stripEventInputNamesFromAbi}
 */
export function stripInputNames<TAbiEvent extends AbiEvent>(
  eventAbi: TAbiEvent
): StripEventInputNames<TAbiEvent> {
  return {
    ...eventAbi,
    inputs: stripParameterNames(eventAbi.inputs),
  } as any;
}

type StripParameterNames<TAbiParameters extends readonly AbiParameter[]> = {
  [K in keyof TAbiParameters]: StripParameterName<TAbiParameters[K]>;
};

function stripParameterNames<TAbiParameters extends readonly AbiParameter[]>(
  parameters: TAbiParameters
): StripParameterNames<TAbiParameters> {
  return parameters.map((it) => stripParameterName(it)) as any;
}

type StripParameterName<TAbiParameter extends AbiParameter> = Prettify<
  TAbiParameter extends Extract<
    AbiParameter,
    { type: "tuple" | `tuple[${string}]` }
  >
    ? Omit<TAbiParameter, "name" | "components"> & {
        components: StripParameterNames<TAbiParameter["components"]>;
      }
    : Omit<TAbiParameter, "name">
>;

function stripParameterName<TAbiParameter extends AbiParameter>(
  parameter: TAbiParameter
): StripParameterName<TAbiParameter> {
  switch (parameter.type) {
    case "tuple": {
      const { name, ...fields } = parameter;

      return {
        ...fields,
        components: stripParameterNames((parameter as any).components),
      } as any;
    }

    default: {
      const { name, ...fields } = parameter;

      return {
        ...fields,
      } as any;
    }
  }
}
