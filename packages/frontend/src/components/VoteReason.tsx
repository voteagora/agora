import { css } from "@emotion/css";

import * as theme from "../theme";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { VoteReasonFragment$key } from "./__generated__/VoteReasonFragment.graphql";

type Props = {
  fragmentKey: VoteReasonFragment$key;
};

export function VoteReason({ fragmentKey }: Props) {
  const vote = useFragment(
    graphql`
      fragment VoteReasonFragment on Vote {
        reason
      }
    `,
    fragmentKey
  );

  return (
    <pre
      className={css`
        font-family: ${theme.fontFamily.sans};
        font-size: ${theme.fontSize.xs};
        font-weight: ${theme.fontWeight.medium};
        white-space: pre-wrap;
        color: #66676b;
        width: fit-content;
      `}
    >
      {vote.reason}
    </pre>
  );
}
