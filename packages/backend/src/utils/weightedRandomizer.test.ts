import { weightedRandomizer } from "./weightedRandomizer";

describe("weightedRandomizer", () => {
  it("works", () => {
    // Set up an array of 100 items with weights from 1 to 100
    let arr: { name: number; weight: number }[] = [];
    for (let i = 1; i <= 100; i++) {
      arr.push({ name: i, weight: i });
    }

    // Array to count the frequency each item appears at the top of the list
    let count = new Array(100).fill(0);

    let iterations = 100000;
    for (let i = 0; i < iterations; i++) {
      let result = weightedRandomizer(arr, String(i));
      let topItem = result[0];
      count[topItem.name - 1]++; // Increment the count for this item
    }

    // Check that the probability of each item appearing at the top is close to its weight
    let sumWeights = (100 * 101) / 2; // Sum of an arithmetic series: n/2 * (first + last)
    let tolerance = 0.01; // Allow 1% deviation from the expected probability
    for (let i = 0; i < 100; i++) {
      let probability = count[i] / iterations;
      let expectedProbability = (i + 1) / sumWeights;
      if (Math.abs(probability - expectedProbability) > tolerance) {
        console.log(
          `Test failed: item ${
            i + 1
          } appeared with probability ${probability}, but expected ${expectedProbability}`
        );
        return;
      }
    }
    console.log("Test passed");
  });
});
