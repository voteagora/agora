/**
 * An error for wrapping other errors and adding metadata.
 */
export class StructuredError extends Error {
  readonly values: any;
  constructor(values: any, cause: unknown) {
    super("StructuredError", { cause });

    this.values = values;
  }
}
