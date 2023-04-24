import { ProgressBarRenderArgs } from "../progressBar";

import { RendererToken } from "./render";

export function progressPercentageDisplay({
  current,
  total,
}: Pick<ProgressBarRenderArgs, "current" | "total">): RendererToken {
  return {
    type: "TEXT",
    value: `${Math.round((current / total) * 100)}%`,
  };
}
