import { collectGenerator, limitGenerator } from "./generatorUtils";

describe("limitGenerator", () => {
  it("should generate the correct number of entries", async () => {
    expect(
      await collectGenerator(
        limitGenerator(
          (async function* () {
            while (true) {
              yield 1;
            }
          })(),
          3
        )
      )
    ).toEqual([1, 1, 1]);
  });
});
