import { css } from "@emotion/css";
import { VStack } from "../../components/VStack";
import * as theme from "../../theme";
import { Form, formHeadingStyle } from "./CreateProposalForm";
import AddTransactionsDetails from "./AddTransactionsDetails";

function StandardForm({ form }: { form: Form }) {
  return (
    <VStack>
      <h4 className={formHeadingStyle}>Proposed transaction</h4>
      <p
        className={css`
          font-size: ${theme.fontSize.base};
          color: ${theme.colors.gray["4f"]};
        `}
      >
        Proposed transactions will execute if your proposal passes. If you skip
        this step, a transfer of 0 ETH to the 0 address will be added.
      </p>

      <AddTransactionsDetails optionIndex={0} form={form} />
    </VStack>
  );
}

export default StandardForm;
