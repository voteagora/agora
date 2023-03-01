export function coerceLevelDbNotfoundError<T>(
  promise: Promise<T>
): Promise<T | null> {
  return promise.catch((err) => {
    if (err.code === "LEVEL_NOT_FOUND") {
      return null;
    } else {
      throw err;
    }
  });
}
