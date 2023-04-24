export function makeMovingSumTracker(windowSizeMs: number) {
  const values: { ts: number; value: number }[] = [];

  function drainOldValues(ts: number) {
    while (values.length > 0 && values[0].ts < ts - windowSizeMs) {
      values.shift();
    }
  }

  return {
    update(value: number, ts: number) {
      values.push({
        value,
        ts,
      });

      drainOldValues(ts);

      return this.sum();
    },

    sum() {
      return values.reduce((acc, it) => acc + it.value, 0);
    },
  };
}
