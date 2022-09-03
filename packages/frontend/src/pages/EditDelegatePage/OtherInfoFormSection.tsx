import { formSectionContainerStyles } from "./TopIssuesFormSection";
import { formSectionHeadingStyle } from "./PastProposalsFormSection";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { InputGroup } from "./InputGroup";
import { YesNoSelector } from "./YesNoSelector";

export function OtherInfoFormSection() {
  return (
    <div className={formSectionContainerStyles}>
      <h3 className={formSectionHeadingStyle}>Other info</h3>

      <div
        className={css`
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: ${theme.spacing["4"]};

          margin-top: ${theme.spacing["4"]};
        `}
      >
        <InputGroup title="Twitter" placeholder="@yourname" />
        <InputGroup title="Discord" placeholder="yourname#2142" />
        <InputGroup
          title="Email (will not be public)"
          placeholder="you@gmail.com"
        />

        <YesNoSelector selection={"yes"} onSelectionChanged={console.log} />
      </div>
    </div>
  );
}
