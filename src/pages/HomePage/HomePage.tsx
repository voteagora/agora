import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { HomePageQuery } from "./__generated__/HomePageQuery.graphql";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { OverviewMetricsContainer } from "./OverviewMetricsContainer";
import { DelegatesContainer } from "./DelegatesContainer";
import { PageHeader } from "../../components/PageHeader";
import { usePrimaryAccount } from "../../components/EthersProviderProvider";
import { PageContainer } from "../../components/PageContainer";

export function HomePage() {
  const address = usePrimaryAccount();

  const result = useLazyLoadQuery<HomePageQuery>(
    graphql`
      query HomePageQuery($address: ID!) {
        ...DelegatesContainerFragment
        ...OverviewMetricsContainer

        account(id: $address) {
          ...PageHeaderFragment
        }
      }
    `,
    {
      address,
    }
  );

  if (!result.account) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader accountFragment={result.account} />
      <Hero />
      <OverviewMetricsContainer fragmentRef={result} />
      <PageDivider />
      <DelegatesContainer fragmentKey={result} />
    </PageContainer>
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
