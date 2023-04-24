export type ErrorReporter = {
  captureException(error: unknown): void;
};

export function loggingErrorReporter(): ErrorReporter {
  return {
    captureException(error: unknown) {
      console.warn(error);
    },
  };
}
