import { css } from "@emotion/css";
import * as theme from "../../theme";
import { inputLabelStyle } from "./InputGroup";
import { HStack, VStack } from "../../components/VStack";

type Props = {
  onSelectionChanged: (newSelection: "yes" | "no") => void;
  selection: "yes" | "no" | undefined;
};

export function YesNoSelector({ onSelectionChanged, selection }: Props) {
  return (
    <VStack>
      <h4 className={inputLabelStyle}>Open to sponsoring proposals</h4>

      <HStack
        className={css`
          background: ${theme.colors.gray["100"]};
          border-radius: ${theme.borderRadius.md};
          border-width: ${theme.spacing.px};
          border-color: ${theme.colors.gray["300"]};
          overflow: hidden;
        `}
      >
        <div
          onClick={() => onSelectionChanged("yes")}
          className={css`
            border-radius: 0.375rem 0 0 0.375rem;
            ${selection === "yes" && selectedStyle}
            ${yesNoOptionStyle};
          `}
        >
          Yes
        </div>
        <div
          onClick={() => onSelectionChanged("no")}
          className={css`
            border-radius: 0 0.375rem 0.375rem 0;
            ${selection === "no" && selectedStyle}
            ${yesNoOptionStyle};
          `}
        >
          No
        </div>
      </HStack>
    </VStack>
  );
}

const yesNoOptionStyle = css`
  padding: ${theme.spacing["3"]} ${theme.spacing["3"]};
  flex: 1;
  text-align: center;
  cursor: pointer;

  :hover {
    background: ${theme.colors.white};
  }
`;

const selectedStyle = css`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${theme.boxShadow.newDefault};
`;
