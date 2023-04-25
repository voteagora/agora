import { ethers } from "ethers";

const LENGTH_MARKER = "=";

/**
 * Implements the efficient lexicographical encoding algorithm described in
 * this [paper]. The code is based on the [elen][library] package and modified
 * to work with `ethers.js` `BigNumber` instances.
 *
 * [paper]: https://prataprc.github.io/jsonsort.io/collate.pdf
 * [library]: https://www.npmjs.com/package/elen
 */
export function efficientLengthEncodingNaturalNumbers(num: ethers.BigNumber) {
  const isNegative = num.lt(0);

  return [
    ...(() => {
      const encoded = efficientLengthEncodingNaturalPositiveNumbers(num.abs());

      if (!isNegative) {
        return encoded;
      }

      return encoded.split("").map((it, idx) => {
        switch (it) {
          case LENGTH_MARKER: {
            return "-";
          }

          case "0":
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
            return 9 - Number(it);

          default:
            throw new Error(`unknown character ${it}`);
        }
      });
    })(),
  ].join("");
}

function efficientLengthEncodingNaturalPositiveNumbers(
  num: ethers.BigNumber
): string {
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
