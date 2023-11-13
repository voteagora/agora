import { it, fc } from "@fast-check/jest";

import {
  efficientLengthEncodingNaturalNumbers,
  efficientLengthEncodingStringAsc,
  efficientLengthEncodingStringDesc,
} from "./efficientLengthEncoding";
import { ethers } from "ethers";
import { compareBy } from "./sortUtils";

describe("efficientLengthEncoding", () => {
  it.prop([fc.array(fc.integer())])("sorts numbers correctly", (numbers) => {
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
  });

  it.prop([fc.array(fc.string())])("sorts strings A-Z correctly", (strings) => {
    const values = strings.map((str, idx) => ({ str, idx }));
    const referenceSortedValues = values
      .slice()
      .sort(
        compareBy((it) =>
          it.str
            .toLowerCase()
            .replace(" ", "")
            .replace(/[^a-z0-9]/g, "")
        )
      )
      .map((it) => it.idx);

    const encodedSort = values
      .slice()
      .map((item) => ({
        str: item.str,
        idx: item.idx,
        encoded: efficientLengthEncodingStringDesc(item.str),
      }))
      .sort(compareBy((it) => it.encoded));

    const encodedValues = encodedSort.map((it) => it.idx);

    expect(encodedValues).toEqual(referenceSortedValues);
  });

  // it.prop([fc.array(fc.string({ minLength: 1 }))])(
  //   "sorts strings Z-A correctly",
  //   (strings) => {
  //     const values = strings
  //       .filter(
  //         (it) => it.replace(" ", "").replace(/[^a-zA-Z]/g, "").length > 0
  //       )
  //       .map((str, idx) => ({ str, idx }));
  //     const referenceSortedValues = values
  //       .slice()
  //       .sort((a, b) => {
  //         const scoreA = a.str
  //           .toLowerCase()
  //           .replace(" ", "")
  //           .replace(/[^a-z0-9]/g, "");
  //         const scoreB = b.str
  //           .toLowerCase()
  //           .replace(" ", "")
  //           .replace(/[^a-z0-9]/g, "");

  //         // if (scoreA.length === 0 && scoreB.length > 0) return -1;
  //         // if (scoreB.length === 0 && scoreA.length > 0) return 1;

  //         return scoreA < scoreB ? 1 : scoreA > scoreB ? -1 : 0;
  //       })
  //       .map((it) => it.idx);

  //     const encodedSort = values
  //       .slice()
  //       .map((item) => ({
  //         str: item.str,
  //         idx: item.idx,
  //         encoded: efficientLengthEncodingStringAsc(item.str),
  //       }))
  //       .sort(compareBy((it) => it.encoded));

  //     const encodedValues = encodedSort.map((it) => it.idx);

  //     expect(encodedValues).toEqual(referenceSortedValues);
  //   }
  // );
});
