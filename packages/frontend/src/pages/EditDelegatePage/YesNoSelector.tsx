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
          background: ${theme.colors.gray["200"]};
          border-radius: ${theme.borderRadius.md};
          overflow: hidden;
        `}
      >
        <div
          onClick={() => onSelectionChanged("yes")}
          className={css`
            ${selection === "yes" && selectedStyle}
            ${yesNoOptionStyle};
          `}
        >
          Yes
        </div>
        <div
          onClick={() => onSelectionChanged("no")}
          className={css`
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
  padding: ${theme.spacing["2"]} ${theme.spacing["3"]};
  flex: 1;
  text-align: center;
  cursor: pointer;

  :hover {
    background: ${theme.colors.gray["400"]};
  }
`;

const selectedStyle = css`
  background: ${theme.colors.gray["500"]};
`;
