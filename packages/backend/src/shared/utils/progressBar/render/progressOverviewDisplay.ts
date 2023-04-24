import { ProgressBarRenderArgs } from "../progressBar";

import { RendererToken } from "./render";

const numberFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  minimumSignificantDigits: 5,
  maximumSignificantDigits: 5,
});

export function progressOverviewDisplay({
  current,
  total,
}: Pick<ProgressBarRenderArgs, "current" | "total">): RendererToken {
  return {
    type: "TEXT",
    value: `[${numberFormat.format(current)}/${numberFormat.format(total)}]`,
  };
}
