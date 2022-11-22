import { usePreloadedQuery } from "react-relay/hooks";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { OverviewMetricsContainer } from "./OverviewMetricsContainer";
import { DelegatesContainer } from "./DelegatesContainer";
import { VStack } from "../../components/VStack";
import { orgName } from "../../components/PageHeader";
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
    <VStack
      className={css`
        max-width: ${theme.maxWidth["xl"]};
        text-align: center;
        padding: 0 ${theme.spacing["4"]};

        margin: ${theme.spacing["16"]} 0;
      `}
    >
      <h1
        className={css`
          font-weight: ${theme.fontWeight.extrabold};
          font-size: ${theme.fontSize["2xl"]};
        `}
      >
        Agora is the home of {orgName} voters
      </h1>

      <p
        className={css`
          color: ${theme.colors.gray["700"]};
          font-size: ${theme.fontSize.base};
        `}
      >
        {orgName} voters are the stewards for the DAO. You can see them all
        below, delegate your votes to them, or contact them about your ideas.
      </p>
    </VStack>
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
