import { css, cx } from "@emotion/css";
import { buttonStyle } from "../ProposalsPage/ApprovalProposal/ApprovalCastVoteButton";
import { Form } from "./CreateProposalForm";
import { useContractWrite } from "../../hooks/useContractWrite";
import {
  approvalModuleAddress,
  governanceTokenContract,
  governorTokenContract,
} from "../../contracts/contracts";
import { OptimismGovernorV5 } from "../../contracts/generated";
import { BigNumber, ethers } from "ethers";
import * as theme from "../../theme";
import { useOpenDialog } from "../../components/DialogProvider/DialogProvider";
import { useEffect } from "react";

export default function SubmitButton({
  formTarget,
  form,
}: {
  formTarget: React.RefObject<HTMLFormElement>;
  form: Form;
}) {
  const { governorFunction, inputData } = getInputData(form);

  const { write, isLoading, isSuccess, isError, onPrepareError, txHash } =
    useContractWrite<OptimismGovernorV5, "propose" | "proposeWithModule">(
      governorTokenContract,
      governorFunction,
      inputData,
      () => {
        form.reset();
      }
    );

  const openDialog = useOpenDialog();

  function submitProposal() {
    write();
    openDialog({
      type: "CAST_PROPOSAL",
      params: {
        isLoading,
        isError,
        isSuccess,
        txHash,
      },
    });
  }

  useEffect(() => {
    if (isSuccess || isError || isLoading || txHash) {
      openDialog({
        type: "CAST_PROPOSAL",
        params: {
          isLoading,
          isError,
          isSuccess,
          txHash,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isError, isSuccess, txHash]);

  return (
    <button
      type="submit"
      className={cx([
        buttonStyle,
        css`
          width: 40%;
        `,
        onPrepareError &&
          css`
            background: ${theme.colors.gray.eo} !important;
            cursor: not-allowed;
          `,
      ])}
      onClick={(e) => {
        e.preventDefault();
        formTarget.current?.reportValidity();
        if (formTarget.current?.checkValidity() && !onPrepareError)
          submitProposal();
      }}
    >
      Submit proposal
    </button>
  );
}

type BasicInputData = [string[], BigNumber[], string[], string];
type ApprovalInputData = [string, string, string];
type InputData = BasicInputData | ApprovalInputData;

function getInputData(form: Form): {
  governorFunction: "propose" | "proposeWithModule";
  inputData: InputData;
} {
  const description = "# " + form.state.title + "\n" + form.state.description;
  let governorFunction: "propose" | "proposeWithModule" = "propose";

  // provide default values for basic proposal
  let targets: string[] = [];
  let values: BigNumber[] = [];
  let calldatas: string[] = [];
  let inputData: InputData = [targets, values, calldatas, description];

  try {
    // if basic proposal, format data for basic proposal
    if (form.state.proposalType === "Basic") {
      governorFunction = "propose";

      if (form.state.options[0].transactions.length === 0) {
        targets.push(ethers.constants.AddressZero);
        values.push(BigNumber.from(0));
        calldatas.push("0x");
      } else {
        form.state.options[0].transactions.forEach((t) => {
          if (t.type === "Transfer") {
            targets.push(governanceTokenContract.address);
            values.push(BigNumber.from(0));
            calldatas.push(encodeTransfer(t.transferTo, t.transferAmount));
          } else {
            targets.push(ethers.utils.getAddress(t.target));
            values.push(ethers.utils.parseEther(t.value.toString() || "0"));
            calldatas.push(t.calldata);
          }
        });
      }
    } else {
      // if approval proposal, format data for approval proposal
      governorFunction = "proposeWithModule";
      let options: [string[], BigNumber[], string[], string][] = [];

      form.state.options.forEach((option) => {
        const formattedOption: [string[], BigNumber[], string[], string] = [
          [],
          [],
          [],
          option.title,
        ];

        option.transactions.forEach((t) => {
          if (t.type === "Transfer") {
            formattedOption[0].push(governanceTokenContract.address);
            formattedOption[1].push(BigNumber.from(0));
            formattedOption[2].push(
              encodeTransfer(t.transferTo, t.transferAmount)
            );
          } else {
            formattedOption[0].push(ethers.utils.getAddress(t.target));
            formattedOption[1].push(
              ethers.utils.parseEther(t.value.toString() || "0")
            );
            formattedOption[2].push(t.calldata);
          }
        });

        options.push(formattedOption);
      });

      const settings = [
        form.state.maxOptions,
        form.state.criteriaType === "Threshold" ? 0 : 1,
        form.state.budget > 0
          ? governanceTokenContract.address
          : ethers.constants.AddressZero,
        form.state.criteriaType === "Threshold"
          ? ethers.utils.parseEther(form.state.threshold.toString())
          : form.state.topChoices,
        ethers.utils.parseEther(form.state.budget.toString()),
      ];

      inputData = [
        approvalModuleAddress,
        ethers.utils.defaultAbiCoder.encode(
          [
            "tuple(address[],uint256[],bytes[],string)[]",
            "tuple(uint8,uint8,address,uint128,uint128)",
          ],
          [options, settings]
        ),
        description,
      ];
    }
  } catch (e) {
    console.error(e);
  }

  return { governorFunction, inputData };
}

function encodeTransfer(to: string, amount: number): string {
  return (
    "0xa9059cbb" +
    ethers.utils.defaultAbiCoder
      .encode(
        ["address", "uint256"],
        [
          ethers.utils.getAddress(to),
          ethers.utils.parseEther(amount.toString() || "0"),
        ]
      )
      .slice(2)
  );
}
