import { usePreloadedQuery } from "react-relay/hooks";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { OverviewMetricsContainer } from "./OverviewMetricsContainer";
import { DelegatesContainer } from "./DelegatesContainer";
import { VStack, HStack } from "../../components/VStack";
import { orgName } from "../../components/PageHeader";
import partnerBackground from "./partnerBackground.png";
import { query } from "./HomePageRoute";
import { RouteProps } from "../../components/HammockRouter/HammockRouter";
import { HomePageRouteQuery } from "./__generated__/HomePageRouteQuery.graphql";

export function HomePage({
  initialQueryRef,
  variables,
}: RouteProps<HomePageRouteQuery>) {
  const result = usePreloadedQuery<HomePageRouteQuery>(query, initialQueryRef);

  return (
    <>
      <Hero />
      <OverviewMetricsContainer fragmentRef={result} />
      <PageDivider />
      <DelegatesContainer fragmentKey={result} variables={variables as any} />
    </>
  );
}

function Hero() {
  return (
    <HStack
      justifyContent="space-between"
      className={css`
        margin-bottom: -44px;
        width: ${theme.maxWidth["6xl"]};
        padding: 0 ${theme.spacing["4"]};
        @media (max-width: ${theme.maxWidth.md}) {
          flex-direction: column;
          text-align: center;
          max-width: 100%;
          margin-bottom: 0;
        }
      `}
    >
      <VStack
        className={css`
          max-width: ${theme.maxWidth["xl"]};
          margin-top: ${theme.spacing["8"]};
          @media (max-width: ${theme.maxWidth.md}) {
            margin-top: 0;
            margin-bottom: ${theme.spacing["8"]};
          }
        `}
      >
        <h1
          className={css`
            font-weight: ${theme.fontWeight.extrabold};
            font-size: ${theme.fontSize["2xl"]};
            margin-bottom: ${theme.spacing["2"]};
          `}
        >
          Agora is the home of{" "}
          <span
            className={css`
              font-size: ${theme.fontSize["lg"]};
              padding: ${theme.spacing["2"]} ${theme.spacing["3"]};
              background-color: ${theme.colors.partner};
              color: ${theme.colors.white};
              border-radius: ${theme.borderRadius.full};
              font-family: ${theme.fontFamily.partner};
              text-transform: uppercase;
              font-style: italic;
              letter-spacing: 0.075em;
            `}
          >
            {orgName}
          </span>{" "}
          delegates
        </h1>

        <p
          className={css`
            color: ${theme.colors.gray["700"]};
            font-size: ${theme.fontSize.base};
          `}
        >
          OP Delegates are the stewards of the Optimism Token House, appointed
          by token holders to make governance decisions on their behalf.
        </p>
      </VStack>
      <img
        className={css`
          max-width: ${theme.maxWidth["md"]};
        `}
        src={partnerBackground}
        alt="optimism background"
      />
    </HStack>
  );
}

function PageDivider() {
  return (
    <div
      className={css`
        background: ${theme.colors.gray["300"]};
        width: 100%;
        height: 1px;
        margin-top: -${theme.spacing["8"]};
        z-index: -1;
      `}
    />
  );
}

export default HomePage;
