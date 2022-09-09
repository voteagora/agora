import { cx } from "@emotion/css";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

type Props = {
  markdown: string;
};

export function Markdown({ markdown }: Props) {
  return (
    <ReactMarkdown
      children={markdown}
      remarkPlugins={[remarkBreaks]}
      className={cx("prose", "max-w-none")}
    />
  );
}
