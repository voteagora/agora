import "isomorphic-fetch";
import { promises as fs } from "fs";

import { AdminTransport } from "../adminMessage";

export async function dump(adminTransport: AdminTransport) {
  const durableObjectInstanceName = process.env.DURABLE_OBJECT_INSTANCE_NAME!;
  const dumpFile = await fs.open(
    `./data/ops/${durableObjectInstanceName}.jsonl`,
    "w+"
  );

  let cursor;

  while (true) {
    const entries: [string, any][] = (await adminTransport.sendMessage({
      type: "GET_KEYS",
      cursor,
    })) as any;

    const filteredEntries = entries.slice(cursor ? 1 : 0);
    if (!filteredEntries.length) {
      return;
    }

    for (const [key, value] of filteredEntries) {
      await dumpFile.write(
        JSON.stringify({
          key,
          value,
        }) + "\n"
      );

      cursor = key;
    }
  }
}
