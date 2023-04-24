import {
  asyncIterableFromIterable,
  collectGenerator,
  infiniteCountingGenerator,
  infiniteStream,
  limitGenerator,
  makeIterableFromIterator,
  skipGenerator,
} from "./generatorUtils";

describe("limitGenerator", () => {
  it("should generate the correct number of entries", async () => {
    expect(
      await collectGenerator(
        limitGenerator(
          asyncIterableFromIterable(
            makeIterableFromIterator(infiniteStream(1))
          ),
          3
        )
      )
    ).toEqual([1, 1, 1]);
  });
});

describe("skipGenerator", () => {
  it("should skip things", async () => {
    expect(
      await collectGenerator(
        limitGenerator(
          skipGenerator(
            asyncIterableFromIterable(
              makeIterableFromIterator(infiniteCountingGenerator())
            ),
            1
          ),
          3
        )
      )
    ).toEqual([1, 2, 3]);
  });
});
