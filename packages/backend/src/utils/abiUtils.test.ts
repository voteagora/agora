import { decodeArgsFromCalldata } from "./abiUtils";
import { BigNumber } from "ethers";

describe("Decode Calldata Values", () => {
  it("should decode calldata values", () => {
    const calldata =
      "0xa9059cbb00000000000000000000000037f1d6f468d31145960523687df6af7d7ff61e3300000000000000000000000000000000000000000000000053444835ec580000";

    const expectedDecodedArgs = [
      "0x37F1D6f468D31145960523687Df6aF7D7FF61E33",
      BigNumber.from("6000000000000000000"),
    ];

    const decoded = decodeArgsFromCalldata(calldata);

    Array.from(decoded).forEach((val, idx) => {
      if (val instanceof BigNumber) {
        expect(val.eq(expectedDecodedArgs[idx])).toBe(true);
      } else {
        expect(val).toBe(expectedDecodedArgs[idx]);
      }
    });
  });
});
