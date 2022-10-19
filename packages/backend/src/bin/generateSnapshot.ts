import { ethers } from "ethers";
import * as fs from "fs";
import * as readline from "readline";
import { makeReducers } from "../snapshot";

async function main() {
  const reducers = makeReducers();

  const snapshot = await (async () => {
    try {
      return JSON.parse(
        await fs.promises.readFile("./snapshot.json", { encoding: "utf-8" })
      );
    } catch (e) {
      return {};
    }
  })();

  for (const reducer of reducers) {
    const snapshotValue = snapshot[reducer.name];
    const { state: initialState, startingBlock } = (() => {
      if (snapshotValue) {
        return {
          state: reducer.decodeState(snapshotValue.state),
          startingBlock: (snapshotValue.latestBlockFetched ?? 0) + 1,
        };
      }

      return {
        state: reducer.initialState(),
        startingBlock: reducer.startingBlock,
      };
    })();

    let state = initialState;

    const reader = readline.createInterface({
      input: fs.createReadStream(`${reducer.name}.logs.json`),
    });

    let idx = -1;
    let latestBlockFetched = -Infinity;
    for await (const rawLog of reader) {
      idx++;

      const log: ethers.providers.Log = JSON.parse(rawLog);
      if (log.blockNumber < startingBlock) {
        continue;
      }

      console.log({ idx });
      latestBlockFetched = log.blockNumber;

      const event = reducer.iface.parseLog(log);
      const eventHandler = reducer.eventHandlers.find(
        (e) => e.signature === event.signature
      );

      try {
        state = await eventHandler.reduce(state, event, log);
      } catch (e) {
        console.error(e);
      }
    }

    snapshot[reducer.name] = {
      state: reducer.encodeState(state),
      block: latestBlockFetched,
    };
  }

  await fs.promises.writeFile("./snapshot.json", JSON.stringify(snapshot));
}

main();
