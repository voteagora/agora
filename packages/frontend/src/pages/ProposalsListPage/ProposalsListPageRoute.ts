import { graphql } from "react-relay";
import React from "react";

import { RouteLoadingParams } from "../../components/HammockRouter/HammockRouter";

import { ProposalsListPageRouteQuery } from "./__generated__/ProposalsListPageRouteQuery.graphql";

export const query = graphql`
  query ProposalsListPageRouteQuery {
    ...ProposalsListPageProposalsFragment
    ...OverviewMetricsContainerFragment
  }
`;

export const proposalsListPageRoute: RouteLoadingParams<ProposalsListPageRouteQuery> =
  {
    query,
    element: React.lazy(() => import("./ProposalsListPage")),
    variablesFromLocation() {
      return {};
    },
  };
