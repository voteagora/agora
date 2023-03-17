import { marked } from "marked";

import TokensList = marked.TokensList;
import Token = marked.Token;

/**
 * Extract title from a proposal's body/description. Returns null if no title found in the first line.
 * @param body proposal body
 */
const extractTitle = (body: string | undefined): string | null => {
  if (!body) return null;
  const hashResult = body.match(/^\s*#{1,6}\s+([^\n]+)/);
  if (hashResult) {
    return hashResult[1];
  }

  const equalResult = body.match(/^\s*([^\n]+)\n(={3,25}|-{3,25})/);
  if (equalResult) {
    return equalResult[1];
  }

  const textResult = body.match(/^\s*([^\n]+)\s*/);
  if (textResult) {
    return textResult[1];
  }

  return null;
};

const removeBold = (text: string | null): string | null =>
  text ? text.replace(/\*\*/g, "") : text;

const removeItalics = (text: string | null): string | null =>
  text ? text.replace(/__/g, "") : text;

export function trimENSStatementHeader(body: string) {
  return body.replace(
    /^\*?\*?ENS Name:?\*?\*?\s*\S+\s*\n\s*\*?\*?My reasons for wanting to be a delegate:?\*?\*?\s*/gim,
    ""
  );
}

// Taken from https://github.com/nounsDAO/nouns-monorepo/blob/0a96001abe99751afa20c41a00adb8e5e32e6fda/packages/nouns-webapp/src/wrappers/nounsDao.ts#L142-L169
export function getTitleFromProposalDescription(description: string = "") {
  const normalizedDescription = description
    .replace(/\\n/g, "\n")
    .replace(/(^['"]|['"]$)/g, "");

  return (
    removeItalics(removeBold(extractTitle(normalizedDescription)))?.trim() ??
    "Untitled"
  );
}

export function extractTextTokens(token: Token): string[] {
  switch (token.type) {
    case "paragraph":
    case "link":
    case "strong":
    case "em":
      return token.tokens.flatMap(extractTextTokens);

    case "text":
      return [token.raw];

    default:
      return [];
  }
}

export function extractFirstParagraph(tokens: TokensList): null | string {
  for (const token of tokens) {
    if (token.type !== "paragraph") {
      continue;
    }

    const paragraphTokens = extractTextTokens(token);
    if (!paragraphTokens.length) {
      continue;
    }

    return paragraphTokens.join("").replace(/\s+/g, " ");
  }

  return null;
}
