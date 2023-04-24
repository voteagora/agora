import { WriteStream } from "tty";

import { throttle } from "../throttle";

import { RendererToken, renderTokens } from "./render/render";
import { replaceContents } from "./stream";

export type ProgressBarRenderArgs = {
  startTimeMs: number;
  currentTimeMs: number;
  total: number;
  current: number;
};

type ProgressBarRenderFn<ExtraParams> = (
  args: ProgressBarRenderArgs,
  params: ExtraParams
) => RendererToken[];

export class ProgressBar<ExtraParams> {
  private _current: number | null = null;
  private readonly render: (params: ExtraParams) => void;
  private startTime: number | null = null;

  constructor(
    private readonly renderFn: ProgressBarRenderFn<ExtraParams>,
    private readonly total: number,
    private readonly tty: WriteStream = process.stderr,
    throttleMs: number = 16
  ) {
    this.render = throttle((params: ExtraParams) => {
      const tokens = this.renderFn(
        {
          total: this.total,
          current: this._current!,
          currentTimeMs: Date.now(),
          startTimeMs: this.startTime!,
        },
        params
      );

      const output = renderTokens(tokens, this.tty.columns);

      replaceContents(this.tty, output);
    }, throttleMs);
  }

  get current() {
    return this._current ?? 0;
  }

  tick(
    args: { current: number } | { delta: number },
    extraParams: ExtraParams
  ) {
    if (!this._current) {
      this.startTime = Date.now();
    }

    if ("current" in args) {
      this._current = args.current;
    } else if ("delta" in args) {
      this._current = (this._current ?? 0) + args.delta;
    }

    this.render(extraParams);
  }
}
