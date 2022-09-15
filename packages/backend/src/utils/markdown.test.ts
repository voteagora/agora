import { extractFirstParagraph } from "./markdown";
import { marked } from "marked";
import * as dedent from "dedent";

describe("extractFirstParagraph", () => {
  it("handles images links at the beginning", () => {
    const tokens = marked.lexer(dedent`
      ![](https://i.imgur.com/cEKQzYk.png)

      Hi, this is [Noun 22](https://nouns.wtf/noun/22).

      ### Who am I?
      After joining Nouns DAO in the first month of the project’s inception,
    `);

    expect(extractFirstParagraph(tokens)).toEqual("Hi, this is Noun 22.");
  });

  it("handles bold in first paragraph", () => {
    const tokens = marked.lexer(dedent`
      **About Me:** 
      I love Nouns and have been active in the ecosystem for 10+ months...
    `);

    expect(extractFirstParagraph(tokens)).toEqual(
      "About Me: I love Nouns and have been active in the ecosystem for 10+ months..."
    );
  });

  it("single line statements", () => {
    const tokens = marked.lexer(dedent`
      I'm optimistic on the future and believe all spending is useful.
    `);

    expect(extractFirstParagraph(tokens)).toEqual(
      `I'm optimistic on the future and believe all spending is useful.`
    );
  });
});
