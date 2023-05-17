import { ethers } from "ethers";
import * as serde from "./index";
import { RuntimeType } from "./index";

describe("discriminatedUnion", () => {
  const testUnion = serde.discriminatedUnion({
    ONE: serde.object({
      one: serde.string,
    }),

    TWO: serde.object({
      one: serde.string,
      two: serde.bigNumber,
    }),

    TREE: serde.object({
      one: serde.bigNumber,
      two: serde.array(serde.string),
      tree: serde.string,
    }),
  });

  const entity = serde.array(testUnion);

  const value: RuntimeType<typeof entity> = [
    {
      key: "ONE",
      kind: {
        one: "1",
      },
    },
    {
      key: "TWO",
      kind: {
        one: "1",
        two: ethers.BigNumber.from(1),
      },
    },
    {
      key: "TREE",
      kind: {
        one: ethers.BigNumber.from(1),
        two: ["abc"],
        tree: "abcdef",
      },
    },
  ];

  it("serializes", () => {
    expect(entity.serialize(value)).toMatchInlineSnapshot(`
      [
        {
          "key": "ONE",
          "kind": {
            "one": "1",
          },
        },
        {
          "key": "TWO",
          "kind": {
            "one": "1",
            "two": "1",
          },
        },
        {
          "key": "TREE",
          "kind": {
            "one": "1",
            "tree": "abcdef",
            "two": [
              "abc",
            ],
          },
        },
      ]
    `);
  });

  it("deserializes", () => {
    expect(entity.deserialize(entity.serialize(value))).toEqual(value);
  });
});
