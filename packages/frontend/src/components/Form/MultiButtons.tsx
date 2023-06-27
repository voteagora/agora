import { css } from "@emotion/css";
import { HStack } from "../VStack";
import * as theme from "../../theme";
import { buttonStyle } from "../../pages/ProposalsPage/ApprovalProposal/ApprovalCastVoteButton";

export function MultiButtons({
  buttonsProps,
}: {
  buttonsProps: [string, () => void][];
}) {
  return (
    <HStack
      className={css`
        margin-top: ${theme.spacing["4"]};
      `}
      gap="4"
    >
      {buttonsProps.map((buttonProps, index) => {
        return (
          <button
            key={index}
            className={buttonStyle}
            type="button"
            onClick={buttonProps[1]}
          >
            {buttonProps[0]}
          </button>
        );
      })}
    </HStack>
  );
}
