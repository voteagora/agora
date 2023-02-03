import "isomorphic-fetch";

import { loadExportFile } from "../export/fs";
import { batch, indexed, takeLast } from "../utils/generatorUtils";
import { makeProgressBar } from "../utils/progressBarUtils";
import { sendAdminMessage } from "../ops/adminMessage";

/**
 * Cloudflare Workers Durable Object Maximum Batch Size
 */
const batchSize = 128;

async function main() {
  const makeBatchesGenerator = () => batch(loadExportFile(), batchSize);

  await sendAdminMessage({
    type: "CLEAR_STORAGE",
  });

  const [lastLineIdx] = (await takeLast(indexed(makeBatchesGenerator())))!;

  const progressBar = makeProgressBar(lastLineIdx * batchSize);

  for await (const batches of batch(makeBatchesGenerator(), 10)) {
    await sendAdminMessage({
      type: "WRITE_BATCH",
      items: batches,
    });
    progressBar.tick(batchSize * batches.length);
  }
}

main();
