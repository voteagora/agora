import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { VStack } from "../../../components/VStack";
import { useBallot } from "../RetroPGFVoterStore/useBallot";
import { icons } from "../../../icons/icons";
import { buttonStyles } from "../../EditDelegatePage/EditDelegatePage";
import { ethers } from "ethers";

export function RetroPGFBallotModalSubmit({
  onClose,
  goToNextStep,
}: {
  onClose: () => void;
  goToNextStep: () => void;
}) {
  const { ballot, ballotValue, setSignature } = useBallot();

  const isOverspent = ballotValue > 30_000_000;

  const signer = useSignMessage();
  const { address } = useAccount();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const submitBallot = async () => {
    setIsSubmitting(true);

    // Trezor needs the message to be hashed
    const isTrezor = await (async () => {
      const res = await fetch(`${process.env.PUBLIC_URL}/api/auth/is-trezor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });

      const result = await res.json();
      return result.isTrezor ?? false;
    })();

    const message =
      address && isTrezor
        ? ethers.utils.keccak256(Buffer.from(JSON.stringify(ballot)))
        : JSON.stringify(ballot);
    try {
      const signature = await signer.signMessageAsync({
        message,
      });
      if (!signature) {
        setErrorMessage("Error signing ballot");
        setIsSubmitting(false);
        return;
      }
      const res = await fetch(`${process.env.PUBLIC_URL}/api/ballot/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature, address, votes: ballot }),
      });
      if (!res.ok) {
        setErrorMessage((await res.json()).error.message);
        setIsSubmitting(false);
        return;
      }
      setSignature(signature);
      goToNextStep();
    } catch (e) {
      setErrorMessage("Error! try again");
      setIsSubmitting(false);
      return;
    }
  };

  return (
    <VStack
      className={css`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      `}
    >
      <VStack
        className={css`
          background: white;
          border-radius: 12px;
          width: 375px;
          padding: ${theme.spacing["6"]};
          box-shadow: ${theme.boxShadow.newDefault};
          z-index: 1;
          & > div:last-child {
            border-bottom: none;
          }
        `}
      >
        <VStack gap="4">
          <div
            className={css`
              display: flex;
              width: 56px;
              height: 56px;
              align-items: center;
              justify-content: center;
              border-radius: ${theme.spacing["2"]};
              border-width: ${theme.spacing[1]};
              border-color: ${theme.colors.white};
              background: #fbfbfb;
              flex-shrink: 0;
              box-shadow: ${theme.boxShadow.newDefault};
              padding: ${theme.spacing["3"]};
            `}
          >
            <img
              className={css`
                width: 24px;
                height: 24px;
              `}
              src={icons.ballot}
              alt={icons.ballot}
            />
          </div>
          <div>
            <h2
              className={css`
                font-weight: ${theme.fontWeight["semibold"]};
                margin-bottom: ${theme.spacing["1"]};
              `}
            >
              Submit Ballot
            </h2>
            <p>
              Once you submit your ballot, you won't be able to change it. If
              you are ready, go ahead and submit!
            </p>
          </div>
          <VStack gap="1">
            <button
              className={css`
                ${buttonStyles};
              `}
              disabled={isSubmitting || isOverspent}
              onClick={onClose}
            >
              Keep editing
            </button>
            <button
              onClick={submitBallot}
              className={css`
                ${buttonStyles};
                border: none;
                box-shadow: none;
              `}
            >
              {isOverspent && "Ballot exceeds 30M!"}
              {isSubmitting && "Submitting ballot..."}
              {!isSubmitting && errorMessage}
              {!isSubmitting &&
                !errorMessage &&
                !isOverspent &&
                "Submit final ballot"}
            </button>
          </VStack>
        </VStack>
      </VStack>
    </VStack>
  );
}
