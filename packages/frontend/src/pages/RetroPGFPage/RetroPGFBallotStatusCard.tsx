import { css } from "@emotion/css";
import { VStack, HStack } from "../../components/VStack";
import * as theme from "../../theme";
import { buttonStyles } from "../EditDelegatePage/EditDelegatePage";
import { Link } from "../../components/HammockRouter/Link";
import { useBallot } from "./RetroPGFVoterStore/useBallot";
import { icons } from "../../icons/icons";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFBallotStatusCardFragment$key } from "./__generated__/RetroPGFBallotStatusCardFragment.graphql";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import TimestampTooltip from "../../components/TimestampTooltip";

export default function RetroPGFBallotStatusCard({
  fragmentRef,
}: {
  fragmentRef: RetroPGFBallotStatusCardFragment$key;
}) {
  const cutoffTime = new Date("2023-12-07T19:00:00.000Z");

  // Total amount of OP you are allowed to allocate
  const totalAllowedAllocation = 30_000_000;

  const { ballot, signature, refetchBallot } = useBallot();

  const allocatedOPTokens = ballot.reduce(
    (acc, { amount }) => acc + Number(amount),
    0
  );

  const ballotProgress = Math.min(
    Math.round((allocatedOPTokens / totalAllowedAllocation) * 100),
    100
  );

  const { total } = useFragment(
    graphql`
      fragment RetroPGFBallotStatusCardFragment on ProjectsAggregate {
        total
      }
    `,
    fragmentRef
  );

  useEffect(() => {
    refetchBallot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={css`
        box-sizing: border-box;
        border-radius: 12px;
        background: white;
        box-shadow: ${theme.boxShadow.newDefault};
        border: 1px solid ${theme.colors.gray["300"]};
        text-align: left;
        width: 40%;
        padding: ${theme.spacing["4"]} ${theme.spacing["6"]};
        position: relative;
        overflow: hidden;
        @media (max-width: ${theme.maxWidth["lg"]}) {
          width: 100%;
        }
      `}
    >
      <VStack>
        <HStack
          justifyContent="space-between"
          alignItems="center"
          className={css`
            margin-bottom: ${theme.spacing["4"]};
          `}
        >
          <VStack>
            <HStack
              gap="1"
              className={css`
                font-size: ${theme.fontSize["xs"]};
                color: ${theme.colors.gray["700"]};
              `}
            >
              Voting ends in{" "}
              {
                <TimestampTooltip date={cutoffTime}>
                  {formatDistanceToNow(cutoffTime)}
                </TimestampTooltip>
              }
            </HStack>
            <h3
              className={css`
                font-family: "Inter";
                font-style: normal;
                font-weight: 600;
                font-size: 16px;
                line-height: 24px;
                color: #000000;
              `}
            >
              {signature
                ? "You've submitted your ballot!"
                : `You've allocated OP to ${ballot.length}/${total} projects`}
            </h3>
          </VStack>
          {signature && (
            <HStack
              alignItems="center"
              justifyContent="center"
              className={css`
                border-radius: ${theme.borderRadius["full"]};
                background-color: ${theme.colors.gray["100"]};
                width: 40px;
                height: 40px;
              `}
            >
              <img
                className={css`
                  font-size: ${theme.fontSize["xs"]};
                  font-weight: 600;
                  text-transform: uppercase;
                  width: 16px;
                  height: 16px;
                `}
                src={icons.checkGrey}
                alt="check"
              />
            </HStack>
          )}
        </HStack>
        <HStack
          className={css`
            width: 100%;
            justify-content: space-between;
            color: ${theme.colors.gray["700"]};
          `}
        >
          <div
            className={css`
              position: relative;
              width: 60%;
              background-color: #ddd;
              height: 10px;
              margin-top: 20px;
              border-radius: 5px;
            `}
          >
            {signature ? (
              <div
                className={css`
                  width: ${signature ? 100 : ballotProgress}%;
                  background-color: green;
                  height: 10px;
                  border-radius: 5px;
                `}
              ></div>
            ) : (
              <div
                className={css`
                  width: ${signature ? 100 : ballotProgress}%;
                  background-color: red;
                  height: 10px;
                  border-radius: 5px;
                `}
              ></div>
            )}

            <span
              className={css`
                position: absolute;
                top: -20px;
                left: 0;
                font-size: ${theme.fontSize["xs"]};
              `}
            >
              You allocated
            </span>
            <span
              className={css`
                position: absolute;
                top: -20px;
                right: 0;
                font-size: ${theme.fontSize["xs"]};
              `}
            >
              Total
            </span>
            <span
              className={css`
                position: absolute;
                bottom: -20px;
                left: 0;
                font-size: ${theme.fontSize["xs"]};
              `}
            >
              {`${allocatedOPTokens.toLocaleString()} OP`}
            </span>
            <span
              className={css`
                position: absolute;
                bottom: -20px;
                right: 0;
                font-size: ${theme.fontSize["xs"]};
              `}
            >
              {`${totalAllowedAllocation.toLocaleString()} OP`}
            </span>
          </div>
          <Link
            to="/retropgf/3/ballot"
            className={css`
              ${buttonStyles};
              color: black;
            `}
          >
            View Ballot
          </Link>
        </HStack>
      </VStack>
    </div>
  );
}
