import "isomorphic-fetch";
import { sendAdminMessage } from "../adminMessage";
import { promises as fs } from "fs";

async function main() {
  const durableObjectInstanceName = process.env.DURABLE_OBJECT_INSTANCE_NAME!;
  const dumpFile = await fs.open(
    `./data/ops/${durableObjectInstanceName}.jsonl`,
    "w+"
  );

  let cursor;

  while (true) {
    const entries: [string, any][] = (await sendAdminMessage({
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

main();
