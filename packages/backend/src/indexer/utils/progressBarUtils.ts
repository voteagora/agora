import ProgressBar from "progress";

export function makeProgressBar(total: number) {
  return new ProgressBar(
    ":elapseds [:current/:total] :bar :percent @ :rate/s :etas remaining",
    {
      total,
    }
  );
}
