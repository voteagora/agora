import "isomorphic-fetch";

import { loadExportFile } from "../../indexer/export/fs";
import { batch, indexed, takeLast } from "../../utils/generatorUtils";
import { makeProgressBarWithRate } from "../../utils/progressBarUtils";
import { AdminTransport } from "../adminMessage";

/**
 * Cloudflare Workers Durable Object Maximum Batch Size
 */
const batchSize = 128;

export async function load(
  adminTransport: AdminTransport,
  dataDirectory: string
) {
  const makeBatchesGenerator = () =>
    batch(loadExportFile(dataDirectory), batchSize);

  await adminTransport.sendMessage({ type: "CLEAR_STORAGE" });

  const [lastLineIdx] = (await takeLast(indexed(makeBatchesGenerator())))!;

  const progressBar = makeProgressBarWithRate(lastLineIdx * batchSize);

  for await (const batches of batch(makeBatchesGenerator(), 10)) {
    await adminTransport.sendMessage({
      type: "WRITE_BATCH",
      items: batches,
    });
    progressBar.tick({ delta: batchSize * batches.length });
  }
}
