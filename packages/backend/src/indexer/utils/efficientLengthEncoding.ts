import { ethers } from "ethers";

const LENGTH_MARKER = "=";

export function efficientLengthEncodingNaturalPositiveNumbers(
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

export function efficientLengthEncodingStringDesc(str: string) {
  return str
    .toLowerCase()
    .replace(" ", "")
    .replace(/[^a-z0-9]/g, "");
}

// This encoding works for the most part but gives bias to longer strings -- no testcases built
export function efficientLengthEncodingStringAsc(str: string) {
  const score = str
    .toLowerCase()
    .replace(" ", "")
    .replace(/[^a-z0-9]/g, "");

  if (score === "") {
    return "";
  }
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  const reversedAlphabet = alphabet.split("").reverse().join("");
  let encoded = "";
  for (const char of score) {
    const index = alphabet.indexOf(char);
    if (index !== -1) {
      encoded += reversedAlphabet.charAt(index);
    }
  }
  return encoded;
}
