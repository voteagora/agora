import graphql from "babel-plugin-relay/macro";
import {
  RouteLoadingParams,
  Location,
} from "../../components/HammockRouter/HammockRouter";
import React from "react";
import { parseOrderName } from "./DelegatesContainer";
import { HomePageRouteQuery } from "./__generated__/HomePageRouteQuery.graphql";

/* eslint-disable relay/unused-fields, relay/must-colocate-fragment-spreads */
export const query = graphql`
  query HomePageRouteQuery($orderBy: DelegatesOrder!, $seed: String) {
    ...DelegatesContainerFragment @arguments(orderBy: $orderBy, seed: $seed)

    ...OverviewMetricsContainerFragment
  }
`;
/* eslint-enable relay/unused-fields, relay/must-colocate-fragment-spreads */

export type Variables = ReturnType<typeof locationToVariables>;

function locationToVariables(location: Location) {
  return {
    orderBy: parseOrderName(location.search["orderBy"]) ?? "weightedRandom",
    seed: Date.now().toString(),
  };
}

export const homeRoute: RouteLoadingParams<HomePageRouteQuery> = {
  query,
  element: React.lazy(() => import("./HomePage")),
  variablesFromLocation(location) {
    return locationToVariables(location);
  },
};
