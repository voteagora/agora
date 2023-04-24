export type RendererToken =
  | {
      type: "PROGRESS_BAR";

      /**
       * A value between zero and one representing the current progress.
       */
      value: number;
    }
  | {
      type: "TEXT";
      value: string;
    };

export function renderTokens(tokens: RendererToken[], columns: number) {
  const textTokens = tokens.flatMap((token) => {
    if (token.type === "TEXT") {
      return [token];
    }

    return [];
  });

  const textTokensWidth = textTokens.reduce(
    (acc, token) => acc + token.value.length,
    0
  );

  const strings = Array.from(
    (function* () {
      for (const token of tokens) {
        switch (token.type) {
          case "TEXT": {
            yield token.value;
            break;
          }

          case "PROGRESS_BAR": {
            const progressBarWidth = Math.max(0, columns - textTokensWidth);
            const completedTokens = Math.round(token.value * progressBarWidth);
            const incompleteTokens = progressBarWidth - completedTokens;

            yield "=".repeat(completedTokens);
            yield "-".repeat(incompleteTokens);
            break;
          }
        }
      }
    })()
  );

  return strings.join("");
}
