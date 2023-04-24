import { graphql } from "react-relay";
import React from "react";

import { RouteLoadingParams } from "../../components/HammockRouter/HammockRouter";

import { HomePageRouteQuery } from "./__generated__/HomePageRouteQuery.graphql";

export type LocationVariables = HomePageRouteQuery["variables"];

export const query = graphql`
  query HomePageRouteQuery($orderBy: DelegatesOrder!) {
    ...DelegatesContainerFragment @arguments(orderBy: $orderBy)
    ...OverviewMetricsContainerFragment
  }
`;

const orderByValidValues: HomePageRouteQuery["variables"]["orderBy"][] = [
  "mostVotingPower",
  // "mostRelevant",
  // "mostNounsRepresented",
  "leastVotesCast",
  // "mostRecentlyActive",
  "mostVotesCast",
];

export const homePageRoute: RouteLoadingParams<HomePageRouteQuery> = {
  query,
  element: React.lazy(() => import("./HomePage")),
  variablesFromLocation(location) {
    return {
      orderBy:
        orderByValidValues.find(
          (needle) => needle === location.search["orderBy"]
        ) ?? "mostVotingPower",
    };
  },
};
