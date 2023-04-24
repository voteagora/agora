import { countConsecutiveValues } from "./countConsecutiveValues";

describe("countConsecutiveValues", () => {
  it("works with no items", () => {
    expect(countConsecutiveValues([])).toEqual(0);
  });

  it("works with a single item", () => {
    expect(countConsecutiveValues([1n])).toEqual(1);
  });

  it("works with many non-consecutive items", () => {
    expect(countConsecutiveValues([1n, 3n, 7n])).toEqual(1);
  });

  it("works with consecutive items", () => {
    expect(countConsecutiveValues([1n, 2n, 3n, 7n, 8n])).toEqual(2);
  });
});
