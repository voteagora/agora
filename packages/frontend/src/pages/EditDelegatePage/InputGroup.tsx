import { css } from "@emotion/css";

import * as theme from "../../theme";

import { sharedInputStyle } from "./TopIssuesFormSection";

type Props = {
  title: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
};

export const inputLabelStyle = css`
  font-weight: bold;
  font-size: ${theme.fontSize.xs};
  margin-bottom: ${theme.spacing["2"]};
`;

export function InputGroup({ title, placeholder, value, onChange }: Props) {
  return (
    <label
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <h4 className={inputLabelStyle}>{title}</h4>
      <input
        className={sharedInputStyle}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
