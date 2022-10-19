import { ethers } from "ethers";
import { getAllLogs } from "../events";
import { promises as fs } from "fs";
import { filterForEventHandlers, makeReducers } from "../snapshot";

async function main() {
  const provider = new ethers.providers.AlchemyProvider();

  const reducers = makeReducers();

  const latestBlockNumber = await provider.getBlockNumber();

  const snapshot = await (async () => {
    try {
      return JSON.parse(
        (await fs.readFile("./snapshot.json")).toString("utf-8")
      );
    } catch (e) {
      return {};
    }
  })();

  for (const reducer of reducers) {
    const filter = filterForEventHandlers(reducer);
    const snapshotValue = snapshot[reducer.name];
    let state = (() => {
      if (snapshotValue) {
        return reducer.decodeState(snapshotValue.state);
      }

      return reducer.initialState();
    })();

    const { logs, latestBlockFetched } = await getAllLogs(
      provider,
      filter,
      latestBlockNumber,
      snapshotValue?.block ?? reducer.startingBlock
    );

    let idx = 0;
    for (const log of logs) {
      console.log({ idx, len: logs.length });

      const event = reducer.iface.parseLog(log);
      const eventHandler = reducer.eventHandlers.find(
        (e) => e.signature === event.signature
      );

      try {
        state = await eventHandler.reduce(state, event, log);
      } catch (e) {
        console.error(e);
      }
      idx++;
    }

    snapshot[reducer.name] = {
      state: reducer.encodeState(state),
      block: latestBlockFetched,
    };
  }

  await fs.writeFile("./snapshot.json", JSON.stringify(snapshot));
}

main();
