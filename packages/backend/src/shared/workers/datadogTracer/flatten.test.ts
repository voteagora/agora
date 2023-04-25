import { flattenMetaInputType } from "./flatten";

describe("flatten", () => {
  it("should flatten", () => {
    expect(
      flattenMetaInputType({
        args: {
          hello: "world",
          values: [1, 2, 3],
          nestedValues: [1, 2, 3, [4, 5, [6, 7], [9, []]]],
        },
      })
    ).toMatchInlineSnapshot(`
      {
        "args.hello": "world",
        "args.nestedValues.0": "1",
        "args.nestedValues.1": "2",
        "args.nestedValues.2": "3",
        "args.nestedValues.3.0": "4",
        "args.nestedValues.3.1": "5",
        "args.nestedValues.3.2.0": "6",
        "args.nestedValues.3.2.1": "7",
        "args.nestedValues.3.3.0": "9",
        "args.values.0": "1",
        "args.values.1": "2",
        "args.values.2": "3",
      }
    `);
  });
});
