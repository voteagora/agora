import { compareBy } from "./sortUtils";

describe("compareBy", () => {
  it("compareBy ascending", () => {
    expect(
      [{ value: 1 }, { value: 3 }, { value: 2 }].sort(
        compareBy((it) => it.value)
      )
    ).toMatchInlineSnapshot(`
      [
        {
          "value": 1,
        },
        {
          "value": 2,
        },
        {
          "value": 3,
        },
      ]
    `);
  });
});
