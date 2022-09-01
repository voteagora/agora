import { fromMarkdown } from "mdast-util-from-markdown";

export function getTitleFromProposalDescription(description: string) {
  const parsed = fromMarkdown(description);
  const firstChild = parsed.children[0];
  if (firstChild.type !== "heading") {
    return null;
  }

  if (firstChild.children.length !== 1) {
    return null;
  }

  const firstTextNode = firstChild.children[0];
  if (firstTextNode.type !== "text") {
    return null;
  }

  return firstTextNode.value;
}
