import { ProgressBarRenderArgs } from "../progressBar";

import { RendererToken } from "./render";

export function progressBarDisplay({
  current,
  total,
}: Pick<ProgressBarRenderArgs, "current" | "total">): RendererToken {
  return {
    type: "PROGRESS_BAR",
    value: current / total,
  };
}
