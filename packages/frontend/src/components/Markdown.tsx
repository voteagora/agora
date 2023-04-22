import { css, cx } from "@emotion/css";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import sanitizeHtml from "sanitize-html";

import * as theme from "../theme";

type Props = {
  markdown: string;
};

export function Markdown({ markdown }: Props) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      children={sanitizeHtml(markdown)}
      remarkPlugins={[remarkBreaks]}
      className={cx(
        "prose",
        "max-w-none",
        css`
          h1 {
            font-size: ${theme.fontSize["2xl"]};
          }

          h2 {
            font-size: ${theme.fontSize["xl"]};
            margin-bottom: ${theme.spacing[2]};
            margin-top: ${theme.spacing[8]};
          }

          h3 {
            font-size: ${theme.fontSize["lg"]};
            margin-bottom: ${theme.spacing[2]};
            margin-top: ${theme.spacing[8]};
          }

          h4 {
            font-size: ${theme.fontSize["lg"]};
            margin-bottom: ${theme.spacing[2]};
            margin-top: ${theme.spacing[8]};
          }

          h5 {
            font-size: ${theme.fontSize["lg"]};
            margin-bottom: ${theme.spacing[2]};
            margin-top: ${theme.spacing[8]};
          }

          h6 {
            font-size: ${theme.fontSize["lg"]};
            margin-bottom: ${theme.spacing[2]};
            margin-top: ${theme.spacing[8]};
          }

          pre {
            background-color: ${theme.colors["white"]};
            border-radius: ${theme.borderRadius["lg"]};
            border: 1px solid ${theme.colors.gray.eb};
          }

          code {
            color: ${theme.colors.gray["800"]};
          }

          ul,
          ol {
            padding-left: 1.2rem;
          }

          li {
            padding-left: ${theme.spacing["1"]};
          }

          li::marker,
          ol::marker {
            color: ${theme.colors.gray["800"]};
          }

          img {
            border-radius: ${theme.borderRadius["lg"]};
          }

          a {
            text-decoration: none;
            font-weight: inherit;
            padding-bottom: 1px;
            border-bottom: 1px solid ${theme.colors.gray["400"]};
            transition: 200ms all;
          }

          a:hover {
            border-bottom: 1px solid ${theme.colors.gray["600"]};
          }

          p {
            word-break: break-word;
          }
        `
      )}
    />
  );
}
