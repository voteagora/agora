import { ProgressBarRenderArgs } from "../progressBar";
import { formatDurationShort } from "../../formatDurationShort";

import { RendererToken } from "./render";

export function remainingTimeDisplay(
  { total, current }: Pick<ProgressBarRenderArgs, "current" | "total">,
  rate: number
): RendererToken {
  const remaining = total - current;
  const secondsRemaining = remaining / rate;

  return {
    type: "TEXT",
    value: `eta ${formatDurationShort({
      seconds: Math.round(secondsRemaining),
    })}`,
  };
}
