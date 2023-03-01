/**
 * Taken from deno std https://deno.land/std@0.149.0/streams/delimiter.ts?source#L94
 */

interface TextLineStreamOptions {
  /** Allow splitting by solo \r */
  allowCR: boolean;
}

export class TextLineStream extends TransformStream<string, string> {
  readonly #allowCR: boolean;
  #buf = "";

  constructor(options?: TextLineStreamOptions) {
    super({
      transform: (chunk, controller) => this.#handle(chunk, controller),
      flush: (controller) => this.#handle("\r\n", controller),
    });
    this.#allowCR = options?.allowCR ?? false;
  }

  #handle(chunk: string, controller: TransformStreamDefaultController<string>) {
    chunk = this.#buf + chunk;

    for (;;) {
      const lfIndex = chunk.indexOf("\n");

      if (this.#allowCR) {
        const crIndex = chunk.indexOf("\r");

        if (
          crIndex !== -1 &&
          crIndex !== chunk.length - 1 &&
          (lfIndex === -1 || lfIndex - 1 > crIndex)
        ) {
          controller.enqueue(chunk.slice(0, crIndex));
          chunk = chunk.slice(crIndex + 1);
          continue;
        }
      }

      if (lfIndex !== -1) {
        let crOrLfIndex = lfIndex;
        if (chunk[lfIndex - 1] === "\r") {
          crOrLfIndex--;
        }
        controller.enqueue(chunk.slice(0, crOrLfIndex));
        chunk = chunk.slice(lfIndex + 1);
        continue;
      }

      break;
    }

    this.#buf = chunk;
  }
}
