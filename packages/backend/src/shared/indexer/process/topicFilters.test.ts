import { narrow, parseAbi } from "abitype";

import { nounsTokenIndexer } from "../../../deployments/nouns/indexers/NounsToken/NounsToken";
import { alligatorIndexer } from "../../../deployments/nouns/indexers/Alligator";

import { mergeTopicFilters, topicFilterForIndexers } from "./topicFilters";
import {
  makeIndexerDefinition,
  widenIndexerDefinition,
} from "./indexerDefinition";
import { intoContractInstance } from "./contractInstance";

describe("mergeTopicFilters", () => {
  it("should merge two filters", () =>
    expect(
      mergeTopicFilters(
        [
          ["a", "b"],
          ["e", "f"],
        ],

        [["c", "d"], [], ["g", "h"]]
      )
    ).toMatchInlineSnapshot(`
      [
        [
          "a",
          "b",
          "c",
          "d",
        ],
        [
          "e",
          "f",
        ],
        [
          "g",
          "h",
        ],
      ]
    `));
});

describe("topicFilterForIndexers", () => {
  it("should work with multiple indexers", () => {
    const indexerA = makeIndexerDefinition(
      intoContractInstance({
        address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
        abi: parseAbi([
          "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
        ]),
        startingBlock: 1,
      }),
      {},
      {
        name: "IndexerA",
        eventHandlers: {
          Transfer: {
            handle: () => {},
          },
        },
      }
    );

    const indexerB = makeIndexerDefinition(
      intoContractInstance({
        address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        abi: parseAbi([
          `event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner)`,
        ]),
        startingBlock: 1,
      }),
      {},
      {
        name: "IndexerB",
        eventHandlers: {
          NewOwner: {
            handle: () => {},
          },
        },
      }
    );

    expect(
      topicFilterForIndexers([
        widenIndexerDefinition(indexerA),
        widenIndexerDefinition(indexerB),
      ])
    ).toMatchInlineSnapshot(`
      {
        "address": [
          "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
          "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        ],
        "topics": [
          [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0xce0457fe73731f824cc272376169235128c118b49d344817417c6d108d155e82",
          ],
        ],
      }
    `);
  });
});
