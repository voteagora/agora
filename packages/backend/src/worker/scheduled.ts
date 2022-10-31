import Toucan from "toucan-js";
import { Env } from "./env";
import { ethers } from "ethers";
import { parseStorage, updateSnapshot } from "../snapshot";
import { loadSnapshot, updateLatestSnapshot } from "./snapshot";

export async function scheduled(cron: string, env: Env, sentry: Toucan) {
  const provider = new ethers.providers.AlchemyProvider(
    "mainnet",
    env.ALCHEMY_API_KEY
  );

  await Promise.all([
    await (async () => {
      if (cron !== "0 * * * *") {
        return;
      }

      const oldSnapshot = await loadSnapshot(env);

      const nextSnapshot = await updateSnapshot(sentry, provider, oldSnapshot);

      await env.INDEXER.put("snapshot.json", JSON.stringify(nextSnapshot));
      updateLatestSnapshot(parseStorage(nextSnapshot));
    })(),
  ]);
}
