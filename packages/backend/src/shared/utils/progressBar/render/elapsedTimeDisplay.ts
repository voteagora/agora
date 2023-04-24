import { ProgressBarRenderArgs } from "../progressBar";

import { RendererToken } from "./render";

export function elapsedTimeDisplay({
  currentTimeMs,
  startTimeMs,
}: Pick<
  ProgressBarRenderArgs,
  "currentTimeMs" | "startTimeMs"
>): RendererToken {
  return {
    type: "TEXT",
    value: `${((currentTimeMs - startTimeMs) / 1000).toFixed(1)}s`,
  };
}
