import { makeContractInstance } from "@agora/common";
import { parseAbi } from "abitype";

import { countingStream } from "../../utils/generatorUtils";
import { DurableObjectEntityStore } from "../storage/entityStore/durableObjects/durableObjectEntityStore";
import { MemoryStorage } from "../storage/entityStore/durableObjects/storageInterface/memory/memoryStorage";
import {
  FakeBlockProvider,
  FakeBlockProviderBlock,
} from "../blockProvider/fakeBlockProvider";
import { FakeLogProvider } from "../logProvider/fakeLogProvider";
import * as serde from "../serde";
import {
  appendBlocksWithLogs,
  makeBlockIdentifier,
  makeEncodeLogArgs,
  makeStorageEntryForLatestBlock,
} from "../testUtils";

import { makeEntityDefinition, maxReorgBlocksDepth } from "./process";
import { followChain, makeInitialStorageArea } from "./followChain";
import { intoContractInstance } from "./contractInstance";
import { makeIndexerDefinition } from "./indexerDefinition";

const finalizedBlockNumber = 0;

const abi = parseAbi(["event ALogEvent()"]);

const testContractInstance = intoContractInstance(
  makeContractInstance({
    abi,
    address: "0x0000000000000000000000000000000000000000",
    startingBlock: finalizedBlockNumber + 1,
  })
);

const entityDefinitions = {
  LatestEvent: makeEntityDefinition({
    serde: serde.object({
      latestBlockNumber: serde.number,
      latestBlockHash: serde.string,
    }),
    indexes: {},
  }),
};

const testContractIndexer = makeIndexerDefinition(
  testContractInstance,
  entityDefinitions,
  {
    name: "TestContract",
    eventHandlers: {
      ALogEvent: {
        async handle(handle, event, log) {
          handle.saveEntity("LatestEvent", "id", {
            latestBlockNumber: log.blockNumber,
            latestBlockHash: log.blockHash,
          });
        },
      },
    },
  }
);

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
      entityDefinitions,
      blockProvider,
      logProvider,
      storageArea
    );

    appendBlocksWithLogs(initialFinalizedBlock, blocks, [
      [
        makeEncodeLogArgs({
          contractInstance: testContractInstance,
          values: [],
          eventName: "ALogEvent",
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
          "depth": 2,
          "nextBlock": 3,
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
          },
          "tipBlock": {
            "blockNumber": 2,
            "hash": "0x2",
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
          "depth": 1,
          "nextBlock": 4,
          "type": "MORE",
        }
      `);
    }
  });

  // todo: add more test cases
  // * reorg

  // todo: fix bugs
  // * the value returned by stepChainForward is kinda wrong
});
