export function throttle<Args>(
  fn: (args: Args) => void,
  ms: number
): (args: Args) => void {
  let lastCall: number | null = null;

  return (args) => {
    const now = Date.now();
    if (lastCall !== null) {
      const timeSinceLastCall = now - lastCall;
      if (timeSinceLastCall <= ms) {
        return;
      }
    }

    fn(args);
    lastCall = now;
  };
}
