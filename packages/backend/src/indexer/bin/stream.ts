import { loadExportFile } from "../export/fs";
import { batch, indexed, takeLast } from "../utils/generatorUtils";
import { AdminWebSocket } from "../adminSocket/socket";
import { makeProgressBar } from "../utils/progressBarUtils";

/**
 * Cloudflare Workers Durable Object Maximum Batch Size
 */
const batchSize = 128;

async function main() {
  const adminSocket = await AdminWebSocket.open();

  const makeBatchesGenerator = () =>
    indexed(batch(loadExportFile(), batchSize));

  const [lastLineIdx] = (await takeLast(makeBatchesGenerator()))!;

  const progressBar = makeProgressBar(lastLineIdx * batchSize);

  for await (const [_, items] of makeBatchesGenerator()) {
    progressBar.tick(batchSize);

    await adminSocket.send({
      type: "WRITE_BATCH",
      items,
    });
  }

  adminSocket.close();
}

main();
