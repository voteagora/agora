import { ethers } from "ethers";

const LENGTH_MARKER = ";";

export function efficientLengthEncodingNaturalPositiveNumbers(
  num: ethers.BigNumber
) {
  const encoded = num.toString();

  return [
    num.gt(0) ? LENGTH_MARKER : "",
    encoded.length > 1
      ? efficientLengthEncodingNaturalPositiveNumbers(
          ethers.BigNumber.from(encoded.length)
        )
      : "",
    encoded,
  ].join("");
}
