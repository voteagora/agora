import * as theme from "../../../theme";
import { css } from "@emotion/css";
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { VStack } from "../../../components/VStack";
import React, { useEffect, useState } from "react";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { ApprovalCastVoteDialogFragment$key } from "./__generated__/ApprovalCastVoteDialogFragment.graphql";
import { useContractWrite } from "../../../hooks/useContractWrite";
import { OptimismGovernorV5 } from "../../../contracts/generated";
import { governorTokenContract } from "../../../contracts/contracts";
import { BigNumber, ethers } from "ethers";
import {
  LoadingVote,
  NoStatementView,
  SuccessMessage,
} from "../CastVoteDialog";
import { buttonStyle } from "./ApprovalCastVoteButton";
import { CheckIcon } from "@heroicons/react/20/solid";
import { TokenAmountDisplay } from "../../../components/TokenAmountDisplay";
import { TokenAmountDisplayFragment$key } from "../../../components/__generated__/TokenAmountDisplayFragment.graphql";

export function ApprovalCastVoteDialog({
  castVoteFragmentRef,
  proposalId,
  hasStatement,
  closeDialog,
  votesRepresentedRef,
}: {
  castVoteFragmentRef: ApprovalCastVoteDialogFragment$key;
  proposalId: string;
  closeDialog: () => void;
  hasStatement: boolean;
  votesRepresentedRef: TokenAmountDisplayFragment$key;
}) {
  const proposalData = useFragment(
    graphql`
      fragment ApprovalCastVoteDialogFragment on ApprovalVotingProposalData {
        options {
          description
          budgetTokensSpent {
            amount
            ...TokenAmountDisplayFragment
          }
        }
        settings {
          maxApprovals
        }
      }
    `,
    castVoteFragmentRef
  );

  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [reason, setReason] = useState<string>("");
  const [abstain, setAbstain] = useState<boolean>(false);
  const [encodedParams, setEncodedParams] = useState<string>("");
  const maxChecked = proposalData.settings.maxApprovals;
  const abstainOptionId = proposalData.options.length; // Abstain option is always last

  const handleOnChange = (optionId: number) => {
    if (optionId === abstainOptionId) {
      setAbstain((prev) => !prev);
      setSelectedOptions([]);
    } else {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions((prev) =>
          prev.filter((value) => value !== optionId)
        );
      } else if (selectedOptions.length < maxChecked) {
        setAbstain(false);
        setSelectedOptions((prev) => [...prev, optionId]);
      }
    }
  };

  // 0 = for, 1 = abstain
  const { write, isLoading, isSuccess, isError } = useContractWrite<
    OptimismGovernorV5,
    "castVoteWithReasonAndParams"
  >(
    governorTokenContract,
    "castVoteWithReasonAndParams",
    [proposalId, abstain ? 1 : 0, reason, encodedParams],
    () => {}
  );

  useEffect(() => {
    const encoded = abstain
      ? "0x"
      : ethers.utils.defaultAbiCoder.encode(
          ["uint256[]"],
          [selectedOptions.sort()]
        );
    setEncodedParams(encoded);
  }, [selectedOptions, abstain]);

  return (
    <VStack
      alignItems="center"
      className={css`
        padding: ${theme.spacing["8"]};
        font-family: ${theme.fontFamily.inter};
      `}
    >
      <Dialog.Panel
        as={motion.div}
        initial={{
          scale: 0.9,
          translateY: theme.spacing["8"],
        }}
        animate={{ translateY: 0, scale: 1 }}
        className={css`
          width: 100%;
          max-width: ${theme.maxWidth.lg};
          background: ${theme.colors.white};
          border-radius: ${theme.spacing["3"]};
          padding: ${theme.spacing["6"]};
        `}
      >
        {hasStatement && isLoading && <LoadingVote />}
        {hasStatement && isSuccess && <SuccessMessage />}
        {hasStatement && isError && <p>Something went wrong</p>}
        {!hasStatement && <NoStatementView />}
        {hasStatement && !isLoading && !isSuccess && (
          <VStack>
            <VStack
              className={css`
                margin-bottom: ${theme.spacing["4"]};
              `}
            >
              <p
                className={css`
                  font-size: ${theme.fontSize["xl"]};
                  font-weight: ${theme.fontWeight.bold};
                `}
              >
                Select up to {maxChecked} option{maxChecked > 1 && "s"}
              </p>
              <p
                className={css`
                  font-size: ${theme.fontSize["xs"]};
                  color: ${theme.colors.gray[700]};
                  font-weight: ${theme.fontWeight.medium};
                  margin-top: ${theme.spacing["1"]};
                `}
              >
                Note: onchain votes are final and cannot be edited once
                submitted.
              </p>
            </VStack>
            <VStack
              className={css`
                max-height: 46vh;
                overflow-y: scroll;
              `}
            >
              {proposalData.options.map((option, index) => (
                <CheckCard
                  key={index}
                  title={option.description}
                  description={
                    <p>
                      {BigNumber.from(
                        option.budgetTokensSpent.amount
                      ).isZero() ? (
                        "No token transfer request"
                      ) : (
                        <>
                          Requesting{" "}
                          <TokenAmountDisplay
                            fragment={option.budgetTokensSpent}
                          />
                        </>
                      )}
                    </p>
                  }
                  checked={selectedOptions.includes(index)}
                  checkedOptions={selectedOptions.length}
                  onClick={() => handleOnChange(index)}
                  abstain={abstain}
                />
              ))}
              {/* Abstain card */}
              <CheckCard
                key={proposalData.options.length}
                title={"Abstain"}
                description={"Vote for no options"}
                checked={!!abstain}
                checkedOptions={selectedOptions.length}
                onClick={() => handleOnChange(abstainOptionId)}
                abstain={abstain}
              />
            </VStack>
            <CastVoteWithReason
              onVoteClick={write}
              reason={reason}
              setReason={setReason}
              numberOfOptions={selectedOptions.length}
              abstain={abstain}
              votesRepresentedRef={votesRepresentedRef}
            />
          </VStack>
        )}
      </Dialog.Panel>
    </VStack>
  );
}

function CastVoteWithReason({
  reason,
  setReason,
  onVoteClick,
  numberOfOptions,
  abstain,
  votesRepresentedRef,
}: {
  onVoteClick: () => void;
  reason: string;
  setReason: React.Dispatch<React.SetStateAction<string>>;
  numberOfOptions: number;
  abstain: boolean;
  votesRepresentedRef: TokenAmountDisplayFragment$key;
}) {
  return (
    <VStack
      className={css`
        border: 1px solid ${theme.colors.gray[300]};
        border-radius: ${theme.borderRadius.lg};
        margin-top: ${theme.spacing["4"]};
      `}
    >
      <textarea
        className={css`
          padding: ${theme.spacing["4"]};
          resize: none;
          border-radius: ${theme.borderRadius.lg};
          background-color: ${theme.colors.gray.fa};
          :focus {
            outline: 0px;
          }
        `}
        placeholder="I believe..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <VStack
        justifyContent="stretch"
        alignItems="stretch"
        className={css`
          padding-top: ${theme.spacing["1"]};
          padding-bottom: ${theme.spacing["3"]};
          padding-left: ${theme.spacing["3"]};
          padding-right: ${theme.spacing["3"]};
          background-color: ${theme.colors.gray.fa};
          border-bottom-left-radius: ${theme.borderRadius.lg};
          border-bottom-right-radius: ${theme.borderRadius.lg};
        `}
      >
        {!abstain && numberOfOptions > 0 && (
          <button className={buttonStyle} onClick={() => onVoteClick()}>
            Vote for {numberOfOptions} option
            {numberOfOptions > 1 && "s"} with{" "}
            {<TokenAmountDisplay fragment={votesRepresentedRef} />}
          </button>
        )}
        {!abstain && numberOfOptions === 0 && (
          <button className={buttonStyle} disabled>
            Select at least one option
          </button>
        )}
        {abstain && (
          <button className={buttonStyle} onClick={() => onVoteClick()}>
            Vote for no options with{" "}
            {<TokenAmountDisplay fragment={votesRepresentedRef} />}
          </button>
        )}
      </VStack>
    </VStack>
  );
}

function CheckCard({
  title,
  checked,
  onClick,
  description,
  checkedOptions,
  abstain,
}: {
  title: string;
  checked: boolean;
  onClick: () => void;
  description: string | JSX.Element;
  checkedOptions: number;
  abstain: boolean;
}) {
  return (
    <div
      className={css`
        padding: ${theme.spacing["2"]} 0;
        cursor: pointer;
        position: relative;
        padding-right: ${theme.spacing["12"]};
      `}
      onClick={onClick}
    >
      <p
        className={css`
          font-weight: ${theme.fontWeight.medium};
        `}
      >
        {title}
      </p>
      <div
        className={css`
          font-size: ${theme.fontSize.xs};
          font-weight: ${theme.fontWeight.medium};
          color: ${theme.colors.gray["700"]};
        `}
      >
        {description}
      </div>
      <div
        className={css`
          position: absolute;
          right: ${theme.spacing["4"]};
          top: 50%;
          transform: translateY(-50%);
          width: ${theme.spacing["7"]};
          height: ${theme.spacing["7"]};
          border-radius: ${theme.borderRadius.md};
          border: 1px solid ${theme.colors.gray.eo};
          background-color: ${theme.colors.gray.fa};
          display: flex;
          justify-content: center;
          align-items: center;
        `}
      >
        {checked && (
          <CheckIcon
            className={css`
              width: ${theme.spacing["5"]};
              height: ${theme.spacing["5"]};
              color: ${theme.colors.black};

              & > path {
                stroke-width: 2px;
                stroke: ${theme.colors.black};
              }
            `}
          />
        )}
      </div>
    </div>
  );
}
