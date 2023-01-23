import fc from "fast-check";
import { efficientLengthEncodingNaturalNumbers } from "./efficientLengthEncoding";
import { ethers } from "ethers";
import { compareBy } from "./sortUtils";

describe("efficientLengthEncoding", () => {
  it("sorts numbers correctly", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({})), (numbers) => {
        const values = numbers.map((number, idx) => ({ number, idx }));
        const referenceSortedValues = values
          .slice()
          .sort(compareBy((it) => it.number))
          .map((it) => it.idx);

        const encodedSort = values
          .slice()
          .map((item) => ({
            number: item.number,
            idx: item.idx,
            encoded: efficientLengthEncodingNaturalNumbers(
              ethers.BigNumber.from(item.number)
            ),
          }))
          .sort(compareBy((it) => it.encoded));

        const encodedValues = encodedSort.map((it) => it.idx);

        expect(encodedValues).toEqual(referenceSortedValues);
      })
    );
  });
});
