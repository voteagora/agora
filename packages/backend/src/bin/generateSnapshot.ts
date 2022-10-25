import "isomorphic-fetch";
import { ethers } from "ethers";
import { NNSENSReverseResolver__factory } from "../contracts/generated";
import { promises as fs } from "fs";
import { updateSnapshot } from "../snapshot";
import { makeMockSentry } from "../sentry";

async function main() {
  const provider = new ethers.providers.AlchemyProvider(
    "mainnet",
    process.env.ALCHEMY_API_KEY
  );

  const resolver = NNSENSReverseResolver__factory.connect(
    "0x5982cE3554B18a5CF02169049e81ec43BFB73961",
    provider
  );

  const snapshot = await (async () => {
    try {
      return JSON.parse(
        (await fs.readFile("./snapshot.json")).toString("utf-8")
      );
    } catch (e) {
      return {};
    }
  })();

  const nextSnapshot = await updateSnapshot(
    makeMockSentry(),
    provider,
    resolver,
    snapshot
  );

  await fs.writeFile("./snapshot.json", JSON.stringify(nextSnapshot));
}

main();
