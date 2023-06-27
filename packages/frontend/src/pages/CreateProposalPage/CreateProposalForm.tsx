import { css } from "@emotion/css";
import * as theme from "../../theme";
import { UseForm, useForm } from "../EditDelegatePage/useForm";
import { HStack, VStack } from "../../components/VStack";
import { useRef } from "react";
import ProposalTypeRow from "./ProposalTypeRow";
import TitleDescriptionRow from "./TitleDescriptionRow";
import StandardForm from "./StandardForm";
import ApprovalCriteriaRow from "./ApprovalCriteriaRow";
import ApprovalOptionsRow from "./ApprovalOptionsRow";
import SubmitButton from "./SubmitButton";

type FormValues = {
  proposalType: "Basic" | "Approval";
  title: string;
  description: string;
  budget: number;
  maxOptions: number;
  criteriaType: "Threshold" | "Top Choices";
  threshold: number;
  topChoices: number;
  options: Option[];
};

type Option = {
  title: string;
  transactions: Transaction[];
};

export type Transaction = {
  type: "Transfer" | "Custom";
  target: string;
  value: number;
  calldata: string;
  transferAmount: number;
  transferTo: string;
};

const initialFormValues: FormValues = {
  proposalType: "Basic",
  title: "",
  description: "",
  budget: 0,
  maxOptions: 1,
  criteriaType: "Threshold",
  threshold: 0,
  topChoices: 1,
  options: [{ title: "", transactions: [] }],
};

export type Form = UseForm<FormValues>;

export function CreateProposalForm() {
  const form = useForm<FormValues>(() => initialFormValues);
  const formTarget = useRef<HTMLFormElement>(null);

  return (
    <VStack
      className={css`
        width: 100%;
      `}
    >
      <form ref={formTarget}>
        <VStack
          className={css`
            ${containerStyle};
          `}
        >
          <div className={boxStyle}>
            <h1
              className={css`
                font-size: ${theme.fontSize["2xl"]};
                font-weight: bold;
                padding-bottom: ${theme.spacing["1"]};
              `}
            >
              Create proposal
            </h1>
            <p
              className={css`
                color: ${theme.colors.gray["4f"]};
              `}
            >
              Please describe your proposal, and remember to proofread as
              proposals cannot be edited once published onchain.
            </p>
            <ProposalTypeRow form={form} />
            <TitleDescriptionRow form={form} />
          </div>
          {form.state.proposalType === "Approval" && (
            <>
              <div className={boxStyle}>
                <ApprovalCriteriaRow form={form} />
              </div>
              <div className={boxStyle}>
                <ApprovalOptionsRow form={form} />
              </div>
            </>
          )}
          {form.state.proposalType === "Basic" && (
            <div className={boxStyle}>
              <StandardForm form={form} />
            </div>
          )}
          <HStack
            justifyContent="space-between"
            alignItems="center"
            className={css`
              padding: ${theme.spacing["8"]};
            `}
          >
            <p
              className={css`
                color: ${theme.colors.gray["4f"]};
                font-weight: 500;
                width: 60%;
              `}
            >
              Only the Optimism Foundation manager address can create proposals
              for the time being.
            </p>
            <SubmitButton formTarget={formTarget} form={form} />
          </HStack>
        </VStack>
      </form>
    </VStack>
  );
}

const containerStyle = css`
  background-color: ${theme.colors.white};
  border-radius: ${theme.spacing["3"]};
  border-width: ${theme.spacing.px};
  border-color: ${theme.colors.gray["300"]};
  box-shadow: ${theme.boxShadow.newDefault};
`;

const boxStyle = css`
  padding: ${theme.spacing["8"]};
  border-bottom: 1px solid ${theme.colors.gray["300"]};
`;

export const formHeadingStyle = css`
  font-size: ${theme.fontSize.base};
  font-weight: bold;
  margin-bottom: ${theme.spacing["2"]};
`;
