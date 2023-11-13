import graphql from "babel-plugin-relay/macro";
import {
  RouteLoadingParams,
  Location,
} from "../../components/HammockRouter/HammockRouter";
import React from "react";
import { RetroPGFRouteQuery } from "./__generated__/RetroPGFRouteQuery.graphql";
import {
  parseFilterName,
  parseListFilterName,
  parseListOrderName,
  parseOrderName,
} from "./RetroPGFProjectListContent";

/* eslint-disable relay/unused-fields, relay/must-colocate-fragment-spreads */
export const query = graphql`
  query RetroPGFRouteQuery(
    $orderBy: ProjectOrder!
    $listOrderBy: ListOrder!
    $category: [ProjectCategory!]
    $listCategory: [ListCategory!]
    $likedBy: String
    $seed: String
    $search: String
  ) {
    ...RetroPGFApplicationContainerFragment
      @arguments(
        orderBy: $orderBy
        category: $category
        seed: $seed
        search: $search
      )

    ...RetroPGFListsContainerFragment
      @arguments(
        orderBy: $listOrderBy
        seed: $seed
        search: $search
        likedBy: $likedBy
        category: $listCategory
      )

    retroPGF {
      projectsAggregate {
        ...RetroPGFBallotStatusCardFragment
        ...RetroPGFMetricsContainer
        ...RetroPGFProjectListContentFragment
      }
    }
  }
`;
/* eslint-enable relay/unused-fields, relay/must-colocate-fragment-spreads */

export type RPGFVariables = ReturnType<typeof locationToVariables>;

function locationToVariables(location: Location) {
  return {
    orderBy: parseOrderName(location.search["orderBy"]) ?? "shuffle",
    listOrderBy:
      parseListOrderName(location.search["listOrderBy"]) ?? "alphabeticalAZ",
    category: parseFilterName(location.search["category"]) ?? (null as any),
    listCategory:
      parseListFilterName(location.search["listCategory"]) ?? (null as any),
    likedBy: location.search["likedBy"] ?? (null as any),
    seed: Date.now().toString(),
    search: location.search["search"] ?? "",
    tab: (location.search["tab"]?.toUpperCase() ?? "PROJECTS") as
      | "PROJECTS"
      | "LISTS",
  };
}

export const retroPGFRoute: RouteLoadingParams<RetroPGFRouteQuery> = {
  query,
  element: React.lazy(() => import("./RetroPGFProjectListPage")),
  variablesFromLocation(location) {
    return locationToVariables(location);
  },
};
