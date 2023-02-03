import { css, cx } from "@emotion/css";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import {
  colorForSupportType,
  SupportTextProps,
} from "../DelegatePage/VoteDetailsContainer";
import { buttonStyles } from "../EditDelegatePage/EditDelegatePage";
import { useState } from "react";

type Props = {
  onVoteClick: (
    supportType: SupportTextProps["supportType"],
    reason: string
  ) => void;
  className: string;
};

export function CastVoteInput({ onVoteClick, className }: Props) {
  const [reason, setReason] = useState<string>("");

  return (
    <VStack
      className={cx(
        css`
          border: 1px solid #e0e0e0;
          border-radius: ${theme.borderRadius.lg};
        `,
        className
      )}
    >
      <textarea
        className={css`
          padding: ${theme.spacing["4"]};
          resize: none;
          border-radius: ${theme.borderRadius.lg};
          :focus {
            outline: 0px;
          }
        `}
        placeholder="I believe..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <VStack
        justifyContent="stretch"
        alignItems="stretch"
        className={css`
          padding-top: ${theme.spacing["1"]};
          padding-bottom: ${theme.spacing["3"]};
          padding-left: ${theme.spacing["3"]};
          padding-right: ${theme.spacing["3"]};
        `}
      >
        <VoteButtons
          onClick={(supportType) => onVoteClick(supportType, reason)}
        />
      </VStack>
    </VStack>
  );
}

function VoteButtons({
  onClick,
}: {
  onClick: (nextSupportType: SupportTextProps["supportType"]) => void;
}) {
  // todo: check if voting open
  // todo: check if already voted
  // todo: we want to check this from the chain not from the subgraph

  return (
    <HStack gap="2">
      {(["FOR", "AGAINST", "ABSTAIN"] as SupportTextProps["supportType"][]).map(
        (supportType) => (
          <VoteButton
            key={supportType}
            action={supportType}
            onClick={() => {
              onClick(supportType);
            }}
          />
        )
      )}
    </HStack>
  );
}

function VoteButton({
  action,
  onClick,
}: {
  action: SupportTextProps["supportType"];
  onClick: () => void;
}) {
  return (
    <button
      className={css`
        ${voteButtonStyles};
        color: ${colorForSupportType(action)};
        flex: 1;
      `}
      onClick={onClick}
    >
      {action.toLowerCase()}
    </button>
  );
}

const voteButtonStyles = css`
  ${buttonStyles};
  height: ${theme.spacing["8"]};
  text-transform: capitalize;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: ${theme.borderRadius.md};
`;
