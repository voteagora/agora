import { RendererToken } from "./render";

const numberFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumSignificantDigits: 3,
});

export function rateDisplay(rate: number): RendererToken {
  return {
    type: "TEXT",
    value: `@ ${numberFormat.format(rate)}/s`,
  };
}
