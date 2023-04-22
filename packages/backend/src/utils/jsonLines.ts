import { createReadStream } from "fs";
import readline from "readline";

export async function* loadJsonLines<T>(path: string): AsyncGenerator<T> {
  try {
    for await (const line of readline.createInterface({
      input: createReadStream(path),
      crlfDelay: Infinity,
    })) {
      if (!line.length) {
        continue;
      }

      const item = JSON.parse(line) as T;
      yield item;
    }
  } catch (e) {
    if ((e as any).code === "ENOENT") {
      return null;
    }

    throw e;
  }
}
