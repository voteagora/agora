import { useState } from "react";
import { HStack } from "../../components/VStack";
import { buttonStyle } from "../ProposalsPage/ApprovalProposal/ApprovalCastVoteButton";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { BigNumber, ethers } from "ethers";
import { icons } from "../../icons/icons";
import { opAdminAddress } from "../../contracts/contracts";

type Status = "Unconfirmed" | "Valid" | "Invalid";

export default function SimulateTransaction({
  target,
  value,
  calldata,
}: {
  target: string;
  value: BigNumber;
  calldata: string;
}) {
  const [status, setStatus] = useState<Status>("Unconfirmed");
  const [isLoading, setIsLoading] = useState(false);

  // Calldata example:
  // 0xa9059cbb00000000000000000000000037f1d6f468d31145960523687df6af7d7ff61e330000000000000000000000000000000000000000000000000000000000000064
  // 0x4200000000000000000000000000000000000042

  async function simulate() {
    // call tha backend /simulate endpoint
    if (ethers.utils.isAddress(target)) {
      setIsLoading(true);

      try {
        const response = await fetch("/simulate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target,
            value: value.toString(),
            calldata,
            networkId: "10",
            from: opAdminAddress,
          }),
        });

        const res = await response.json();

        if (res.response.transaction.status) {
          setStatus("Valid");
        } else {
          setStatus("Invalid");
        }
      } catch (e) {
        setStatus("Invalid");
      }

      setIsLoading(false);
    } else {
      setStatus("Invalid");
    }
  }

  return (
    <HStack
      alignItems="center"
      className={css`
        height: 100%;
        border: ${theme.spacing.px} solid ${theme.colors.gray.eo};
        border-radius: ${theme.borderRadius.md};
      `}
    >
      <p
        className={css`
          width: 70%;
          margin-left: ${theme.spacing["4"]};
          font-weight: 600;
          color: ${status === "Valid"
            ? theme.colors.green[500]
            : status === "Invalid"
            ? theme.colors.red[500]
            : theme.colors.gray["4f"]};
        `}
      >
        {status}
      </p>
      <button
        className={css`
          ${buttonStyle}
          width: 30%;
          padding: ${theme.spacing["1"]};
          margin-right: ${theme.spacing["2"]};
        `}
        onClick={() => {
          !isLoading && simulate();
        }}
        type="button"
      >
        {isLoading ? (
          <img
            src={icons.spinner}
            alt={icons.spinner}
            className={css`
              margin: 0 auto;
            `}
          />
        ) : (
          "Simulate"
        )}
      </button>
    </HStack>
  );
}
