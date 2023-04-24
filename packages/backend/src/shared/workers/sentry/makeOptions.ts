import { Options } from "toucan-js";

import { Context } from "../context";

export type MakeOptionsParams<Env> = {
  env: Env;
  ctx: Context;
};

export type MakeOptionsFn<Env> = (
  params: MakeOptionsParams<Env>
) => MakeOptionsResult;

export type MakeOptionsResult = {
  options: Options;
  tags: Record<string, string>;
};

export function makeOptionsFnFactory<Env>(
  makeOptionsFn: MakeOptionsFn<Env>
): MakeOptionsFn<Env> {
  return makeOptionsFn;
}
