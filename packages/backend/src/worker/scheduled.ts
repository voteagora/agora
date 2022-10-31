import Toucan from "toucan-js";
import { Env } from "./env";
import { ethers } from "ethers";
import { NNSENSReverseResolver__factory } from "../contracts/generated";
import { parseStorage, updateSnapshot } from "../snapshot";
import { loadSnapshot, updateLatestSnapshot } from "./snapshot";
import { postDiscordMessagesSinceLastUpdate } from "../discord";

export async function scheduled(cron: string, env: Env, sentry: Toucan) {
  const provider = new ethers.providers.AlchemyProvider(
    "mainnet",
    env.ALCHEMY_API_KEY
  );

  const resolver = NNSENSReverseResolver__factory.connect(
    "0x5982cE3554B18a5CF02169049e81ec43BFB73961",
    provider
  );

  await Promise.all([
    await (async () => {
      if (cron !== "0 * * * *") {
        return;
      }

      const oldSnapshot = await loadSnapshot(env);

      const nextSnapshot = await updateSnapshot(
        sentry,
        provider,
        resolver,
        oldSnapshot
      );

      await env.INDEXER.put("snapshot.json", JSON.stringify(nextSnapshot));
      updateLatestSnapshot(parseStorage(nextSnapshot));
    })(),
    await (async () => {
      if (!env.DISCORD_WEBHOOK_URL) {
        return;
      }

      const lastBlock = await env.LAST_BLOCKED_FETCHED.get("block");

      const latestBlock = await provider.getBlockNumber();
      const latestSafeBlock = latestBlock - 10;

      await postDiscordMessagesSinceLastUpdate(
        provider,
        resolver,
        lastBlock ? parseInt(lastBlock) + 1 : latestSafeBlock - 1000,
        latestSafeBlock,
        env.DISCORD_WEBHOOK_URL
      );

      await env.LAST_BLOCKED_FETCHED.put("block", latestSafeBlock.toString());
    })(),
  ]);
}
