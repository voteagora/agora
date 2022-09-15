import { formSectionContainerStyles } from "./TopIssuesFormSection";
import { formSectionHeadingStyle } from "./PastProposalsFormSection";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { InputGroup } from "./InputGroup";
import { YesNoSelector } from "./YesNoSelector";
import { Form } from "./DelegateStatementForm";

type Props = {
  form: Form;
};

export function OtherInfoFormSection({ form }: Props) {
  return (
    <div className={formSectionContainerStyles}>
      <h3 className={formSectionHeadingStyle}>Other info</h3>

      <div
        className={css`
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: ${theme.spacing["4"]};

          margin-top: ${theme.spacing["4"]};

          @media (max-width: ${theme.maxWidth.lg}) {
            grid-template-columns: 1fr;
          }
        `}
      >
        <InputGroup
          title="Twitter"
          placeholder="@yourname"
          value={form.state.twitter}
          onChange={form.onChange.twitter}
        />
        <InputGroup
          title="Discord"
          placeholder="yourname#2142"
          value={form.state.discord}
          onChange={form.onChange.discord}
        />
        <InputGroup
          title="Email (will not be public)"
          placeholder="you@gmail.com"
          value={form.state.email}
          onChange={form.onChange.email}
        />

        <YesNoSelector
          selection={form.state.openToSponsoringProposals}
          onSelectionChanged={form.onChange.openToSponsoringProposals}
        />
      </div>
    </div>
  );
}
