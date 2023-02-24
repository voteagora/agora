export function timeout(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
}

export async function executeWithRetries<T>(
  attempt: () => Promise<T>,
  baseTimeout: number = 1000,
  maxAttempts = 5
): Promise<T> {
  let errors = [];
  for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
    try {
      return await attempt();
    } catch (e) {
      errors.push(e);
      await timeout(baseTimeout * attemptNumber);
    }
  }

  throw new AggregateError(errors);
}
