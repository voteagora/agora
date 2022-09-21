import { marked } from "marked";
import TokensList = marked.TokensList;
import Token = marked.Token;

const hashRegex = /^\s*#{1,6}\s+([^\n]+)/;
const equalTitleRegex = /^\s*([^\n]+)\n(={3,25}|-{3,25})/;

/**
 * Extract a markdown title from a proposal body that uses the `# Title` format
 * Returns null if no title found.
 */
const extractHashTitle = (body: string) => body.match(hashRegex);
/**
 * Extract a markdown title from a proposal body that uses the `Title\n===` format.
 * Returns null if no title found.
 */
const extractEqualTitle = (body: string) => body.match(equalTitleRegex);

/**
 * Extract title from a proposal's body/description. Returns null if no title found in the first line.
 * @param body proposal body
 */
const extractTitle = (body: string | undefined): string | null => {
  if (!body) return null;
  const hashResult = extractHashTitle(body);
  const equalResult = extractEqualTitle(body);
  return hashResult ? hashResult[1] : equalResult ? equalResult[1] : null;
};

const removeBold = (text: string | null): string | null =>
  text ? text.replace(/\*\*/g, "") : text;

const removeItalics = (text: string | null): string | null =>
  text ? text.replace(/__/g, "") : text;

// Taken from https://github.com/nounsDAO/nouns-monorepo/blob/0a96001abe99751afa20c41a00adb8e5e32e6fda/packages/nouns-webapp/src/wrappers/nounsDao.ts#L142-L169
export function getTitleFromProposalDescription(description: string = "") {
  const normalizedDescription = description
    .replace(/\\n/g, "\n")
    .replace(/(^['"]|['"]$)/g, "");

  return (
    removeItalics(removeBold(extractTitle(normalizedDescription))) ?? "Untitled"
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
