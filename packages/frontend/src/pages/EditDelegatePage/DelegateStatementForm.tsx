import { PastProposalsFormSectionProposalListFragment$key } from "./__generated__/PastProposalsFormSectionProposalListFragment.graphql";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import {
  DelegateStatementFormSection,
  tipTextStyle,
} from "./DelegateStatementFormSection";
import { TopIssuesFormSection } from "./TopIssuesFormSection";
import { PastProposalsFormSection } from "./PastProposalsFormSection";
import { OtherInfoFormSection } from "./OtherInfoFormSection";
import { buttonStyles } from "./EditDelegatePage";

type DelegateStatementFormProps = {
  queryFragment: PastProposalsFormSectionProposalListFragment$key;
};

export function DelegateStatementForm({
  queryFragment,
}: DelegateStatementFormProps) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        width: 100%;

        background: ${theme.colors.white};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
        border-radius: ${theme.spacing["3"]};
        box-shadow: ${theme.boxShadow.md};
      `}
    >
      <DelegateStatementFormSection />
      <TopIssuesFormSection />
      <PastProposalsFormSection queryFragment={queryFragment} />
      <OtherInfoFormSection />

      <div
        className={css`
          padding: ${theme.spacing["8"]} ${theme.spacing["6"]};

          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        `}
      >
        <span className={tipTextStyle}>
          Tip: you can always come back and edit your profile at any time.
        </span>

        <button className={buttonStyles}>Submit</button>
      </div>
    </div>
  );
}
