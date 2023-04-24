import { usePreloadedQuery } from "react-relay";
import { css } from "@emotion/css";

import * as theme from "../../theme";
import { VStack } from "../../components/VStack";
import { RoutePropsForRoute } from "../../components/HammockRouter/HammockRouter";
import { PageDivider } from "../../components/PageDivider";

import { DelegatesContainer } from "./DelegatesContainer";
import { OverviewMetricsContainer } from "./OverviewMetricsContainer";
import { homePageRoute, query } from "./HomePageRoute";

export default function HomePage({
  initialQueryRef,
  variables,
}: RoutePropsForRoute<typeof homePageRoute>) {
  const result = usePreloadedQuery(query, initialQueryRef);

  return (
    <>
      <Hero />
      <OverviewMetricsContainer fragmentRef={result} />
      <PageDivider />
      <DelegatesContainer fragmentKey={result} variables={variables} />
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
        @media (max-width: ${theme.maxWidth.lg}) {
          margin: 0;
          text-align: left;
          width: 100%;
        }
      `}
    >
      <h1
        className={css`
          font-weight: ${theme.fontWeight.extrabold};
          font-size: ${theme.fontSize["2xl"]};
          @media (min-width: ${theme.maxWidth.lg}) {
            display: none;
          }
        `}
      >
        Voter metrics
      </h1>
      <h1
        className={css`
          font-weight: ${theme.fontWeight.extrabold};
          font-size: ${theme.fontSize["2xl"]};
          @media (max-width: ${theme.maxWidth.lg}) {
            display: none;
          }
        `}
      >
        Agora is the home of nouns voters
      </h1>

      <p
        className={css`
          color: ${theme.colors.gray["700"]};
          font-size: ${theme.fontSize.base};
          @media (max-width: ${theme.maxWidth.lg}) {
            display: none;
          }
        `}
      >
        Nouns voters are the stewards for the DAO. You can see them all below,
        delegate your votes to them, or contact them about your ideas.
      </p>
    </VStack>
  );
}
