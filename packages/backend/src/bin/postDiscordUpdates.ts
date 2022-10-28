import "isomorphic-fetch";

import { ethers } from "ethers";
import { NNSENSReverseResolver__factory } from "../contracts/generated";
import { postDiscordMessagesSinceLastUpdate } from "../discord";

async function main() {
  const provider = new ethers.providers.AlchemyProvider(
    "mainnet",
    process.env.ALCHEMY_API_KEY
  );

  const resolver = NNSENSReverseResolver__factory.connect(
    "0x5982cE3554B18a5CF02169049e81ec43BFB73961",
    provider
  );

  const latestBlock = await provider.getBlockNumber();

  await postDiscordMessagesSinceLastUpdate(
    provider,
    resolver,
    latestBlock - 10000,
    latestBlock,
    process.env.DISCORD_WEBHOOK_URL
  );
}

main();
