import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { HomePageQuery } from "./__generated__/HomePageQuery.graphql";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { OverviewMetricsContainer } from "./OverviewMetricsContainer";
import { DelegatesContainer } from "./DelegatesContainer";
import { VStack } from "../../components/VStack";
import {
  useLocation,
  Location,
} from "../../components/HammockRouter/HammockRouter";

const filterByValidValues: HomePageQuery["variables"]["filterBy"][] = [
  "seekingDelegation",
  "withStatement",
];

const orderByValidValues: HomePageQuery["variables"]["orderBy"][] = [
  "mostRelevant",
  "mostNounsRepresented",
  "leastVotesCast",
  "mostRecentlyActive",
  "mostVotesCast",
];

export function locationToVariables(location: Location) {
  return {
    filterBy:
      filterByValidValues.find(
        (needle) => needle === location.search["filterBy"]
      ) ?? null,
    orderBy:
      orderByValidValues.find(
        (needle) => needle === location.search["orderBy"]
      ) ?? "mostRelevant",
  };
}

export function HomePage() {
  const location = useLocation();
  const variables = locationToVariables(location);

  const result = useLazyLoadQuery<HomePageQuery>(
    graphql`
      query HomePageQuery(
        $orderBy: WrappedDelegatesOrder!
        $filterBy: WrappedDelegatesWhere
      ) {
        ...DelegatesContainerFragment
          @arguments(orderBy: $orderBy, filterBy: $filterBy)
        ...OverviewMetricsContainer
      }
    `,
    {
      ...variables,
    }
  );

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
      `}
    >
      <h1
        className={css`
          font-weight: ${theme.fontWeight.extrabold};
          font-size: ${theme.fontSize["2xl"]};
        `}
      >
        Agora is the home of nouns voters
      </h1>

      <p
        className={css`
          color: ${theme.colors.gray["700"]};
          font-size: ${theme.fontSize.base};
        `}
      >
        Nouns voters are the stewards for the DAO. You can see them all below,
        delegate your votes to them, or contact them about your ideas.
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
