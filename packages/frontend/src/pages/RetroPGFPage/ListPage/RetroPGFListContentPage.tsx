import { css } from "@emotion/css";
import { VStack, HStack } from "../../../components/VStack";
import * as theme from "../../../theme";
import { RetroPGFListApplicationRow } from "./RetroPGFListApplicationRow";
import { RetroPGFIconListItem } from "../RetroPGFIconListItem";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFListContentPageFragment$key } from "./__generated__/RetroPGFListContentPageFragment.graphql";

export function RetroPGFListContentPage({
  fragmentRef,
}: {
  fragmentRef: RetroPGFListContentPageFragment$key;
}) {
  const list = useFragment(
    graphql`
      fragment RetroPGFListContentPageFragment on List {
        listDescription
        impactEvaluationDescription
        impactEvaluationLink
        listContent {
          ...RetroPGFListApplicationRowFragment
          OPAmount
        }
      }
    `,
    fragmentRef
  );

  return (
    <HStack
      justifyContent="space-between"
      className={css`
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
        @media (max-width: ${theme.maxWidth["lg"]}) {
          flex-direction: column;
        }
      `}
    >
      <div
        className={css`
          border-radius: 12px 0px 0px 12px;
          width: 70%;
          min-height: 70vh;
          box-shadow: ${theme.boxShadow.newDefault};
          border: 1px solid ${theme.colors.gray["300"]};
          z-index: 1;
          background-color: white;
          & > div:last-child {
            border-bottom: none;
          }
          @media (max-width: ${theme.maxWidth["lg"]}) {
            width: 100%;
            border-radius: 12px 12px 0px 0px;
            min-height: 30vh;
          }
        `}
      >
        <VStack>
          <div
            className={css`
              width: 100%;
            `}
          >
            <h3
              className={css`
                padding: ${theme.spacing["6"]};
                padding-bottom: ${theme.spacing["2"]};
                font-style: normal;
                font-weight: 600;
                font-size: 16px;
                line-height: 24px;
                color: #000000;
              `}
            >
              {list.listContent.length} Projects •{" "}
              {formatOPAmount(
                list.listContent.reduce((sum, it) => sum + it.OPAmount, 0)
              )}{" "}
              OP allocated
            </h3>
          </div>
          <div
            className={css`
              width: 100%;
            `}
          >
            {list.listContent.map((application, index) => (
              <RetroPGFListApplicationRow
                key={index}
                fragmentRef={application}
              />
            ))}
          </div>
        </VStack>
      </div>

      <div
        className={css`
          background: ${theme.colors.gray.fa};
          border: 1px solid ${theme.colors.gray["300"]};
          width: 30%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          border-radius: 0px 12px 12px 0px;
          position: relative;
          z-index: 0;
          border-left: none;
          @media (max-width: ${theme.maxWidth["lg"]}) {
            width: 100%;
            border-top: none;
            border-left: 1px solid ${theme.colors.gray["300"]};
            max-width: 100%;
            border-radius: 0px 0px 12px 12px;
            margin-bottom: ${theme.spacing["4"]};
          }
        `}
      >
        <VStack
          className={css`
            width: 100%;
            text-align: left;
            color: ${theme.colors.gray["700"]};
          `}
        >
          <div>
            <h3
              className={css`
                padding-top: ${theme.spacing["6"]};
                padding-right: ${theme.spacing["6"]};
                padding-left: ${theme.spacing["6"]};
                color: ${theme.colors.gray["900"]};
                font-weight: ${theme.fontWeight["medium"]};
              `}
            >
              About
            </h3>
            <p
              className={css`
                padding-top: ${theme.spacing["2"]};
                padding-right: ${theme.spacing["6"]};
                padding-left: ${theme.spacing["6"]};
                padding-bottom: ${theme.spacing["6"]};
              `}
            >
              {list.listDescription}
            </p>
          </div>
          <div
            className={css`
              border-top: 1px solid ${theme.colors.gray["300"]};
            `}
          >
            <h3
              className={css`
                padding-top: ${theme.spacing["6"]};
                padding-right: ${theme.spacing["6"]};
                padding-left: ${theme.spacing["6"]};
                color: ${theme.colors.gray["900"]};
                font-weight: ${theme.fontWeight["medium"]};
              `}
            >
              Impact Evaluation
            </h3>
            <p
              className={css`
                padding-top: ${theme.spacing["2"]};
                padding-right: ${theme.spacing["6"]};
                padding-left: ${theme.spacing["6"]};
                padding-bottom: ${theme.spacing["6"]};
              `}
            >
              {list.impactEvaluationDescription}
            </p>
            <div
              className={css`
                padding-right: ${theme.spacing["6"]};
                padding-left: ${theme.spacing["6"]};
                margin-bottom: ${theme.spacing["6"]};
              `}
            >
              <RetroPGFIconListItem
                text="Impact Evaluation"
                href={list.impactEvaluationLink}
                icon="world"
              />
            </div>
          </div>
        </VStack>
      </div>
    </HStack>
  );
}

function formatOPAmount(amount: number) {
  const numberFormat = new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  });

  const parts = numberFormat.formatToParts(amount);
  return parts
    .filter((part) => part.type !== "currency" && part.type !== "literal")
    .map((part) => part.value)
    .join("");
}
