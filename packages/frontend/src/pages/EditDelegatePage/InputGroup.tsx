import { css } from "@emotion/css";
import * as theme from "../../theme";
import { sharedInputStyle } from "./TopIssuesFormSection";

type Props = {
  title: string;
  placeholder: string;
};

export const inputLabelStyle = css`
  font-weight: bold;
  font-size: ${theme.fontSize.xs};
  margin-bottom: ${theme.spacing["2"]};
`;

export function InputGroup({ title, placeholder }: Props) {
  return (
    <label
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <h4 className={inputLabelStyle}>{title}</h4>
      <input className={sharedInputStyle} placeholder={placeholder} />
    </label>
  );
}
