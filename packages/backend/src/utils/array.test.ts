import { countConsecutiveValues } from "./array";
import { BigNumber } from "ethers";

describe("countConsecutiveValues", () => {
  it("works with no items", () => {
    expect(countConsecutiveValues([])).toEqual(0);
  });

  it("works with a single item", () => {
    expect(countConsecutiveValues([BigNumber.from(1)])).toEqual(1);
  });

  it("works with many non-consecutive items", () => {
    expect(
      countConsecutiveValues([
        BigNumber.from(1),
        BigNumber.from(3),
        BigNumber.from(7),
      ])
    ).toEqual(1);
  });

  it("works with consecutive items", () => {
    expect(
      countConsecutiveValues([
        BigNumber.from(1),
        BigNumber.from(2),
        BigNumber.from(3),
        BigNumber.from(7),
        BigNumber.from(8),
      ])
    ).toEqual(2);
  });
});
