import { css } from "@emotion/css";
import { HStack, VStack } from "../../components/VStack";
import { Switch } from "../../components/Form/Switch";
import * as theme from "../../theme";
import { Form, formHeadingStyle } from "./CreateProposalForm";

function ProposalTypeRow({ form }: { form: Form }) {
  const { proposalType } = form.state;
  const infoText =
    proposalType === "Basic"
      ? "This default proposal type lets delegates vote either yes or no"
      : "This proposal type enables vote for multiple options";
  return (
    <VStack
      className={css`
        margin-top: ${theme.spacing["4"]};
      `}
    >
      <h4 className={formHeadingStyle}>Proposal type</h4>
      <HStack
        className={css`
          @media (max-width: ${theme.maxWidth["4xl"]}) {
            flex-direction: column;
          }
        `}
      >
        <div
          className={css`
            width: 50%;
            @media (max-width: ${theme.maxWidth["4xl"]}) {
              width: 100%;
            }
          `}
        >
          <Switch
            options={["Basic", "Approval"]}
            selection={proposalType}
            onSelectionChanged={form.onChange.proposalType}
          />
        </div>
        <p
          className={css`
            font-size: ${theme.fontSize.base};
            color: ${theme.colors.gray["4f"]};
            margin-left: ${theme.spacing["8"]};
            width: 50%;
            @media (max-width: ${theme.maxWidth["4xl"]}) {
              width: 100%;
              margin-top: ${theme.spacing["2"]};
              margin-left: 0;
            }
          `}
        >
          {infoText}
        </p>
      </HStack>
    </VStack>
  );
}

export default ProposalTypeRow;
