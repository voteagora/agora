import graphql from "babel-plugin-relay/macro";
import {
  RouteLoadingParams,
  Location,
} from "../../components/HammockRouter/HammockRouter";
import React from "react";
import { HomePageRouteQuery } from "./__generated__/HomePageRouteQuery.graphql";
import { parseCitizensOrderName, parseOrderName } from "./VotersContainer";

/* eslint-disable relay/unused-fields, relay/must-colocate-fragment-spreads */
export const query = graphql`
  query HomePageRouteQuery(
    $orderBy: DelegatesOrder!
    $seed: String
    $citizensOrderBy: CitizensOrder!
  ) {
    ...DelegatesContainerFragment @arguments(orderBy: $orderBy, seed: $seed)
    ...CitizensContainerFragment @arguments(orderBy: $citizensOrderBy)

    ...OverviewMetricsContainerFragment
  }
`;
/* eslint-enable relay/unused-fields, relay/must-colocate-fragment-spreads */

export type Variables = ReturnType<typeof locationToVariables>;

function locationToVariables(location: Location) {
  return {
    orderBy: parseOrderName(location.search["orderBy"]) ?? "weightedRandom",
    citizensOrderBy:
      parseCitizensOrderName(location.search["citizensOrderBy"]) ?? "shuffle",
    seed: Date.now().toString(),
    tab: (location.search["tab"]?.toUpperCase() ?? "DELEGATES") as
      | "DELEGATES"
      | "CITIZENS",
  };
}

export const homeRoute: RouteLoadingParams<HomePageRouteQuery> = {
  query,
  element: React.lazy(() => import("./HomePage")),
  variablesFromLocation(location) {
    return locationToVariables(location);
  },
};
