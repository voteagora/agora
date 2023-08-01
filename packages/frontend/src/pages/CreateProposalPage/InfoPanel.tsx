import { css } from "@emotion/css";
import { VStack } from "../../components/VStack";
import * as theme from "../../theme";

function InfoPanel() {
  return (
    <VStack
      className={css`
        background-color: ${theme.colors.gray.fa};
        border-radius: ${theme.spacing["3"]};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray.eo};
        box-shadow: ${theme.boxShadow.newDefault};
        padding: ${theme.spacing["6"]};
      `}
    >
      <h2
        className={css`
          font-size: ${theme.fontSize["2xl"]};
          font-weight: ${theme.fontWeight.black};
          margin-bottom: ${theme.spacing["4"]};
        `}
      >
        About proposals
      </h2>
      <div
        className={css`
          font-size: ${theme.fontSize.sm};
          color: ${theme.colors.gray["4f"]};
          font-weight: ${theme.fontWeight.normal};
          & > p {
            &:not(:last-child) {
              margin-bottom: ${theme.spacing["4"]};
            }
          }
        `}
      >
        <p>
          The Optimism Foundation manager can submit and two types of on-chain
          proposals within the OPTIMISM DAO: Basic Proposals and Approval
          Proposals.
        </p>
        <p>
          Basic proposals are executable proposals that can be passed by the DAO
          to enact a range of smart contract operations executed by accounts
          controlled by the ENS DAO. They accept for, against and abstain votes.
        </p>
        <p>
          Approval proposals are also executable, the difference is that each
          proposal consists of a list of options that can be executed depending
          on the outcome of the vote and the criteria set by the proposal
          creator. A delegate can vote for one or multiple options or abstain.
        </p>
      </div>
    </VStack>
  );
}

export default InfoPanel;
