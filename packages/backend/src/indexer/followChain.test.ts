import { followChain, makeInitialStorageArea } from "./followChain";
import { DurableObjectEntityStore } from "./storage/durableObjects/durableObjectEntityStore";
import { MemoryStorage } from "./storage/durableObjects/memoryStorage";
import {
  FakeBlockProvider,
  FakeBlockProviderBlock,
} from "./blockProvider/fakeBlockProvider";
import { FakeLogProvider } from "./logProvider/fakeLogProvider";
import {
  makeEntityDefinition,
  makeIndexerDefinition,
  maxReorgBlocksDepth,
} from "./process";
import { makeContractInstance } from "../contracts";
import { EventsExample__factory } from "../contracts/generated";
import * as serde from "./serde";
import { countingStream } from "./utils/generatorUtils";
import {
  appendBlocksWithLogs,
  makeBlockIdentifier,
  makeEncodeLogArgs,
  makeStorageEntryForLatestBlock,
} from "./testUtils";

const finalizedBlockNumber = 0;

const testContractInstance = makeContractInstance({
  iface: EventsExample__factory.createInterface(),
  address: "0x0000000000000000000000000000000000000000",
  startingBlock: finalizedBlockNumber + 1,
});

const testContractIndexer = makeIndexerDefinition(testContractInstance, {
  name: "TestContract",
  entities: {
    LatestEvent: makeEntityDefinition({
      serde: serde.object({
        latestBlockNumber: serde.number,
        latestBlockHash: serde.string,
      }),
      indexes: [],
    }),
  },
  eventHandlers: [
    {
      signature: "ALogEvent()",
      async handle(handle, event, log) {
        handle.saveEntity("LatestEvent", "id", {
          latestBlockNumber: log.blockNumber,
          latestBlockHash: log.blockHash,
        });
      },
    },
  ],
});

describe("followChain", () => {
  it("handles processing events", async () => {
    const initialFinalizedBlock = makeBlockIdentifier(finalizedBlockNumber);

    const memoryStorage = new MemoryStorage(
      new Map([makeStorageEntryForLatestBlock(initialFinalizedBlock)])
    );
    const entityStore = new DurableObjectEntityStore(memoryStorage);

    const blocks: FakeBlockProviderBlock[] = [];

    const logProvider = new FakeLogProvider(blocks);
    const blockProvider = new FakeBlockProvider(blocks);

    const storageArea = await makeInitialStorageArea(entityStore);

    const stepChainForward = followChain(
      entityStore,
      [testContractIndexer as any],
      blockProvider,
      logProvider,
      storageArea,
      "dev"
    );

    appendBlocksWithLogs(initialFinalizedBlock, blocks, [
      [
        makeEncodeLogArgs({
          contractInstance: testContractInstance,
          values: [],
          signature: "ALogEvent()",
        }),
      ],
    ]);

    {
      const result = await stepChainForward();

      expect(result).toMatchInlineSnapshot(`
        {
          "depth": -1,
          "nextBlock": 2,
          "type": "MORE",
        }
      `);

      expect(storageArea).toMatchInlineSnapshot(`
        {
          "blockStorageAreas": Map {
            "0x1" => {
              "entities": Map {
                "entity|LatestEvent|id" => {
                  "entity": "LatestEvent",
                  "id": "id",
                  "value": {
                    "latestBlockHash": "0x1",
                    "latestBlockNumber": 1,
                  },
                },
              },
            },
          },
          "finalizedBlock": {
            "blockNumber": 0,
            "hash": "0x0",
          },
          "parents": Map {
            "0x1" => {
              "blockNumber": 0,
              "hash": "0x0",
            },
          },
          "tipBlock": {
            "blockNumber": 1,
            "hash": "0x1",
          },
        }
      `);

      expect(memoryStorage.values).toMatchInlineSnapshot(`
        Map {
          "latest" => {
            "blockNumber": 0,
            "hash": "0x0",
          },
        }
      `);
    }

    appendBlocksWithLogs(
      initialFinalizedBlock,
      blocks,
      Array.from(countingStream(maxReorgBlocksDepth + 1)).map(() => [])
    );

    {
      const result = await stepChainForward();

      expect(result).toMatchInlineSnapshot(`
        {
          "depth": -1,
          "nextBlock": 13,
          "type": "MORE",
        }
      `);

      expect(storageArea).toMatchInlineSnapshot(`
        {
          "blockStorageAreas": Map {},
          "finalizedBlock": {
            "blockNumber": 1,
            "hash": "0x1",
          },
          "parents": Map {
            "0x2" => {
              "blockNumber": 1,
              "hash": "0x1",
            },
            "0x3" => {
              "blockNumber": 2,
              "hash": "0x2",
            },
            "0x4" => {
              "blockNumber": 3,
              "hash": "0x3",
            },
            "0x5" => {
              "blockNumber": 4,
              "hash": "0x4",
            },
            "0x6" => {
              "blockNumber": 5,
              "hash": "0x5",
            },
            "0x7" => {
              "blockNumber": 6,
              "hash": "0x6",
            },
            "0x8" => {
              "blockNumber": 7,
              "hash": "0x7",
            },
            "0x9" => {
              "blockNumber": 8,
              "hash": "0x8",
            },
            "0xa" => {
              "blockNumber": 9,
              "hash": "0x9",
            },
            "0xb" => {
              "blockNumber": 10,
              "hash": "0xa",
            },
            "0xc" => {
              "blockNumber": 11,
              "hash": "0xb",
            },
          },
          "tipBlock": {
            "blockNumber": 12,
            "hash": "0xc",
          },
        }
      `);

      expect(memoryStorage.values).toMatchInlineSnapshot(`
        Map {
          "latest" => {
            "blockNumber": 1,
            "hash": "0x1",
          },
          "entity|LatestEvent|id" => {
            "latestBlockHash": "0x1",
            "latestBlockNumber": 1,
          },
        }
      `);
    }

    {
      const result = await stepChainForward();

      expect(result).toMatchInlineSnapshot(`
        {
          "type": "TIP",
        }
      `);
    }
  });

  // todo: add more test cases
  // * reorg

  // todo: fix bugs
  // * the value returned by stepChainForward is kinda wrong
});
