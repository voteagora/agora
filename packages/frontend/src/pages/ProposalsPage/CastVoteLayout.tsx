import { css } from "@emotion/css";
import { ReactNode } from "react";

import * as theme from "../../theme";
import { HStack } from "../../components/VStack";
import { icons } from "../../icons/icons";
import { contracts } from "../../utils/contracts";

const successMessageText =
  "Success! Your vote has been cast. It will appear once the transaction is confirmed. This might take a few minutes.";

export function CastVoteLayout({
  write,
  isLoading,
  isError,
  isSuccess,
  canExecute,
  txHash,
  children,
}: {
  write: () => void;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  canExecute: boolean;
  txHash?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {isError ? (
        <DisplayMessage message="Transaction reverted" />
      ) : isSuccess ? (
        <DisplayMessage
          message={
            txHash
              ? messageWithLink({
                  message: successMessageText,
                  link: linkForTransaction(txHash),
                  linkText: "View on Etherscan",
                })
              : successMessageText
          }
        />
      ) : isLoading ? (
        <DisplayMessage message="Casting vote" icon={icons.spinner} />
      ) : !canExecute ? (
        <DisplayMessage message="Voting is not possible at this time" />
      ) : (
        <HStack
          className={css`
            padding: ${theme.spacing["4"]};
          `}
          justifyContent="space-between"
          alignItems="center"
        >
          <HStack alignItems="center">{children}</HStack>

          <VoteButton onClick={write}>Vote</VoteButton>
        </HStack>
      )}
    </>
  );
}

const VoteButton = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={css`
        text-align: center;
        border-radius: ${theme.spacing["2"]};
        border: 1px solid ${theme.colors.gray.eb};
        font-weight: ${theme.fontWeight.semibold};
        font-size: ${theme.fontSize.xs};
        color: ${theme.colors.black};
        padding: ${theme.spacing["2"]} ${theme.spacing["6"]};
        cursor: pointer;

        ${!onClick &&
        css`
          background: ${theme.colors.gray.eb};
          color: ${theme.colors.gray["700"]};
          cursor: not-allowed;
        `}

        :hover {
          background: ${theme.colors.gray.eb};
        }
      `}
    >
      {children}
    </div>
  );
};

function DisplayMessage({
  message,
  icon,
}: {
  message: string | JSX.Element;
  icon?: string;
}) {
  return (
    <HStack
      justifyContent="space-between"
      alignItems="center"
      className={css`
        padding: ${theme.spacing["4"]};
      `}
    >
      <div
        className={css`
          font-weight: ${theme.fontWeight.medium};
        `}
      >
        {message}
      </div>
      {icon && (
        <img
          src={icon}
          alt={icon}
          className={css`
            height: 20px;
          `}
        />
      )}
    </HStack>
  );
}

function messageWithLink({
  message,
  link,
  linkText,
}: {
  message: string;
  link: string;
  linkText?: string;
}) {
  return (
    <>
      {message}{" "}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={css`
          font-weight: ${theme.fontWeight.medium};
          color: ${theme.colors.gray["700"]};
        `}
      >
        {linkText || link}
      </a>
    </>
  );
}

function linkForTransaction(txHash: string) {
  return `https://${
    contracts.network === "sepolia" ? "sepolia." : ""
  }etherscan.io/tx/${txHash}`;
}
