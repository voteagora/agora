import Toucan from "toucan-js";
import { Env } from "./env";
import { ethers } from "ethers";
import { updateSnapshot } from "../snapshot";
import { loadSnapshot, writeSnapshot } from "./snapshot";

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

      await writeSnapshot(env, nextSnapshot);
    })(),
  ]);
}
