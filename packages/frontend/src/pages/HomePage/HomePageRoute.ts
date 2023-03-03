import graphql from "babel-plugin-relay/macro";
import {
  RouteLoadingParams,
  Location,
} from "../../components/HammockRouter/HammockRouter";
import React from "react";
import { parseFilterName, parseOrderName } from "./DelegatesContainer";
import { HomePageRouteQuery } from "./__generated__/HomePageRouteQuery.graphql";

export const query = graphql`
  query HomePageRouteQuery(
    $orderBy: DelegatesOrder!
    $filterBy: DelegatesWhere
  ) {
    ...DelegatesContainerFragment
      @arguments(orderBy: $orderBy, filterBy: $filterBy)

    ...OverviewMetricsContainerFragment
  }
`;

export type Variables = ReturnType<typeof locationToVariables>;

function locationToVariables(location: Location) {
  return {
    filterBy: parseFilterName(location.search["filterBy"]),
    orderBy: parseOrderName(location.search["orderBy"]) ?? "mostVotesMostPower",
  };
}

export const homeRoute: RouteLoadingParams<HomePageRouteQuery> = {
  query,
  element: React.lazy(() => import("./HomePage")),
  variablesFromLocation(location) {
    return locationToVariables(location);
  },
};
