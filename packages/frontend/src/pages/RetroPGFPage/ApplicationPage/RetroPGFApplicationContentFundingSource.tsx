import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { HStack, VStack } from "../../../components/VStack";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFApplicationContentFundingSourceFragment$key } from "./__generated__/RetroPGFApplicationContentFundingSourceFragment.graphql";

export function RetroPGFApplicationContentFundingSource({
  fragmentRef,
}: {
  fragmentRef: RetroPGFApplicationContentFundingSourceFragment$key;
}) {
  const { fundingSources } = useFragment(
    graphql`
      fragment RetroPGFApplicationContentFundingSourceFragment on Project {
        fundingSources {
          type
          currency
          amount
          description
        }
      }
    `,
    fragmentRef
  );

  return (
    <>
      <VStack
        className={css`
          padding: 0 ${theme.spacing["4"]};
        `}
      >
        <h2
          className={css`
            font-family: "Inter";
            font-style: normal;
            font-weight: 900;
            font-size: 24px;
            line-height: 29px;
            color: #000000;
          `}
        >
          Funding sources
        </h2>
        <VStack
          className={css`
            min-height: ${theme.spacing["12"]};
            width: 100%;
            height: 100%;
            border: 1px solid ${theme.colors.gray[300]};
            border-radius: ${theme.borderRadius["xl"]};
            box-shadow: ${theme.boxShadow.newDefault};
            margin-top: ${theme.spacing["8"]};
            margin-bottom: ${theme.spacing["8"]};
            padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              align-items: stretch;
              justify-content: flex-end;
              width: 100%;
              height: auto;
            }
          `}
        >
          {(!fundingSources || fundingSources.length === 0) && (
            <VStack
              alignItems="center"
              justifyContent="center"
              className={css`
                padding: ${theme.spacing["8"]};
                color: ${theme.colors.gray["700"]};
              `}
            >
              No funding sources provided
            </VStack>
          )}
          {fundingSources?.map((fundingSource, idx) => (
            <HStack
              key={idx}
              className={css`
                display: flex;
                flex-direction: row;
                padding: ${theme.spacing["4"]};
                @media (max-width: ${theme.maxWidth["2xl"]}) {
                  flex-direction: column;
                  align-items: stretch;
                  justify-content: flex-end;
                }
              `}
            >
              <div
                className={css`
                  flex: 0 0 20%;
                `}
              >
                {formatFundingSource(fundingSource.type)}
              </div>

              <div
                className={css`
                  flex: 1;
                  color: ${theme.colors.gray["700"]};
                `}
              >
                {fundingSource.description}
              </div>
              <div
                className={css`
                  flex: 0 0 20%;
                  text-align: right;
                `}
              >
                {formatNumber(fundingSource.amount)} {fundingSource.currency}
              </div>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </>
  );
}

function formatFundingSource(fundingSource: string) {
  if (fundingSource.split("_")[0].toLowerCase() === "retropgf") {
    return "RetroPGF " + fundingSource.split("_")[1];
  }
  return (
    fundingSource.charAt(0).toUpperCase() + fundingSource.slice(1).toLowerCase()
  )
    .split("_")
    .join(" ");
}

function formatNumber(number: number) {
  const numberFormat = new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "code",
    maximumFractionDigits: 2,
  });

  const parts = numberFormat.formatToParts(number);
  return parts
    .filter((part) => part.type !== "currency" && part.type !== "literal")
    .map((part) => part.value)
    .join("");
}
