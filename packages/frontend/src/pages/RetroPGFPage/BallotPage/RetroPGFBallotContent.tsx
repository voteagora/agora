import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { HStack, VStack } from "../../../components/VStack";
import { useBallot } from "../RetroPGFVoterStore/useBallot";
import { RetroPGFApplicationRow } from "./RetroPGFApplicationRow";
import { buttonStyles } from "../../EditDelegatePage/EditDelegatePage";
import { useOpenDialog } from "../../../components/DialogProvider/DialogProvider";
import { RetroPGFStep } from "../BallotModal/RetroPGFAddToBallotModal";
import { Suspense, useEffect } from "react";

export function RetroPGFBallotContent() {
  const { ballot, signature, refetchBallot } = useBallot();

  const openDialog = useOpenDialog();

  const maxOP = 30_000_000;

  const allocatedOPTokens = ballot.reduce(
    (acc, { amount }) => acc + Number(amount),
    0
  );

  useEffect(() => {
    refetchBallot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VStack
      justifyContent="space-between"
      className={css`
        border-radius: 12px 0px 0px 12px;
        width: 100%;
        min-height: 70vh;
        border: 1px solid ${theme.colors.gray[300]};
        box-shadow: ${theme.boxShadow.newDefault};
        z-index: 1;
        & > div:last-child {
          border-bottom: none;
        }
        @media (max-width: ${theme.maxWidth["2xl"]}) {
          border-radius: 12px 12px 0px 0px;
          min-height: 30vh;
        }
      `}
    >
      <VStack
        justifyContent="start"
        className={css`
          max-height: 70vh;
          overflow-y: auto;
        `}
      >
        {ballot
          ?.sort((a, b) => Number(b.amount) - Number(a.amount))
          .map(({ projectId, amount }) => (
            <Suspense key={projectId}>
              <RetroPGFApplicationRow
                projectId={projectId}
                OPAmount={Number(amount)}
              />
            </Suspense>
          ))}
      </VStack>
      {ballot.length === 0 && (
        <VStack
          alignItems="center"
          justifyContent="center"
          className={css`
            width: 100%;
            height: 100%;
            color: ${theme.colors.gray[700]};
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              height: 50vh;
            }
          `}
        >
          Your ballot is empty
        </VStack>
      )}

      <HStack
        justifyContent="space-between"
        className={css`
          padding: ${theme.spacing["8"]};
          border-top: 1px solid ${theme.colors.gray[300]};
        `}
      >
        <VStack>
          <p
            className={css`
              font-weight: ${theme.fontWeight["medium"]};
              font-size: ${theme.fontSize["xs"]};
              line-height: 16px;
            `}
          >
            Total allocated
          </p>
          <HStack>
            <h3
              className={css`
                font-weight: ${theme.fontWeight["medium"]};
                color: ${
                  allocatedOPTokens > maxOP
                    ? theme.colors.red[500]
                    : theme.colors.black
                }};
                font-size: 16px;
                line-height: 24px;
              `}
            >
              {`${formatNumber(allocatedOPTokens)} OP`}
            </h3>
            <h3
              className={css`
                font-weight: ${theme.fontWeight["medium"]};
                font-size: 16px;
                line-height: 24px;
                color: ${theme.colors.gray[500]};
              `}
            >
              {`/ ${formatNumber(maxOP)} OP`}
            </h3>
          </HStack>
        </VStack>
        {!signature ? (
          allocatedOPTokens > 0 && (
            <button
              className={css`
                ${buttonStyles};
              `}
              onClick={() =>
                openDialog({
                  type: "RPGF",
                  params: {
                    step: RetroPGFStep.SUBMIT,
                  },
                })
              }
            >
              Submit Ballot
            </button>
          )
        ) : (
          <div>Your ballot has been submitted</div>
        )}
      </HStack>
    </VStack>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}
