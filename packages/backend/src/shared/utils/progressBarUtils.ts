import { ProgressBar } from "./progressBar/progressBar";
import { elapsedTimeDisplay } from "./progressBar/render/elapsedTimeDisplay";
import { progressBarDisplay } from "./progressBar/render/progressBarDisplay";
import { makeMovingSumTracker } from "./progressBar/movingSum";
import { insertBetween } from "./insertBetween";
import { progressOverviewDisplay } from "./progressBar/render/progressOverviewDisplay";
import { progressPercentageDisplay } from "./progressBar/render/progressPercentageDisplay";
import { rateDisplay } from "./progressBar/render/rateDisplay";
import { remainingTimeDisplay } from "./progressBar/render/remainingTimeDisplay";

export function makeProgressBarWithRate(total: number) {
  const progressBar = new ProgressBar<{ rate: number }>(
    (args, { rate }) =>
      insertBetween(
        [
          elapsedTimeDisplay(args),
          progressOverviewDisplay(args),
          progressBarDisplay(args),
          progressPercentageDisplay(args),
          rateDisplay(rate),
          remainingTimeDisplay(args, rate),
        ],
        {
          type: "TEXT",
          value: " ",
        }
      ),
    total
  );

  const movingSumWindow = 1_000;
  const movingSumTracker = makeMovingSumTracker(movingSumWindow);

  return {
    tick(args: { tickValue: number } | { delta: number }) {
      const now = Date.now();
      const { nextValue, delta } = (() => {
        if ("tickValue" in args) {
          const nextValue = args.tickValue;
          const delta = Math.max(args.tickValue - progressBar.current, 0);

          return { nextValue, delta };
        } else {
          const nextValue = args.delta + progressBar.current;
          const delta = args.delta;

          return { nextValue, delta };
        }
      })();

      const movingSum = movingSumTracker.update(delta, now);

      progressBar.tick(
        { current: nextValue },
        {
          rate: movingSum / (movingSumWindow / 1000),
        }
      );
    },
  };
}
