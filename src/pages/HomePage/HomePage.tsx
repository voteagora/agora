import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { HomePageQuery } from "./__generated__/HomePageQuery.graphql";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import logo from "../../logo.svg";
import { OverviewMetricsContainer } from "./OverviewMetricsContainer";
import { DelegatesContainer } from "./DelegatesContainer";

export function HomePage() {
  const result = useLazyLoadQuery<HomePageQuery>(
    graphql`
      query HomePageQuery {
        ...DelegatesContainerFragment
      }
    `,
    {}
  );

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: ${theme.fontFamily.sans};
        width: 100%;
      `}
    >
      <PageHeader />
      <Hero />
      <OverviewMetricsContainer />
      <PageDivider />
      <DelegatesContainer fragmentKey={result} />
    </div>
  );
}

function PageHeader() {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: row;
        width: ${theme.maxWidth["6xl"]};
        margin: ${theme.spacing["8"]} auto;
        padding: 0 ${theme.spacing["4"]};
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: row;
          gap: ${theme.spacing["4"]};
        `}
      >
        <img alt="logo" src={logo} />

        <span
          className={css`
            font-size: ${theme.fontSize.sm};
            color: ${theme.colors.gray["700"]};
          `}
        >
          Nouns Agora
        </span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        max-width: ${theme.maxWidth["xl"]};
        text-align: center;

        margin: ${theme.spacing["16"]} 0;
      `}
    >
      <h1
        className={css`
          font-weight: bolder;
          font-size: ${theme.fontSize["3xl"]};
        `}
      >
        Agora is the home of nouns voters
      </h1>

      <p
        className={css`
          color: ${theme.colors.gray["700"]};
          font-size: ${theme.fontSize.sm};
        `}
      >
        Nouns voters are the stewards for the DAO. You can see them all below,
        delegate your votes to them, or contact them about your ideas.
      </p>
    </div>
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
