import graphql from "babel-plugin-relay/macro";
import {
  RouteLoadingParams,
  Location,
} from "../../components/HammockRouter/HammockRouter";
import React from "react";
import { parseOrderName } from "./DelegatesContainer";
import { HomePageRouteQuery } from "./__generated__/HomePageRouteQuery.graphql";

export const query = graphql`
  query HomePageRouteQuery($orderBy: DelegatesOrder!) {
    ...DelegatesContainerFragment @arguments(orderBy: $orderBy)

    ...OverviewMetricsContainerFragment
  }
`;

export type Variables = ReturnType<typeof locationToVariables>;

function locationToVariables(location: Location) {
  return {
    orderBy: parseOrderName(location.search["orderBy"]) ?? "mostVotingPower",
  };
}

export const homeRoute: RouteLoadingParams<HomePageRouteQuery> = {
  query,
  element: React.lazy(() => import("./HomePage")),
  variablesFromLocation(location) {
    return locationToVariables(location);
  },
};
