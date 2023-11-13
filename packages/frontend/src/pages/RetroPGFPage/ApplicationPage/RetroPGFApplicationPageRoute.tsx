import React from "react";
import graphql from "babel-plugin-relay/macro";
import { RouteLoadingParams } from "../../../components/HammockRouter/HammockRouter";
import { RetroPGFApplicationPageRouteQuery } from "./__generated__/RetroPGFApplicationPageRouteQuery.graphql";

/* eslint-disable relay/unused-fields, relay/must-colocate-fragment-spreads */
export const query = graphql`
  query RetroPGFApplicationPageRouteQuery($id: ID!) {
    retroPGF {
      project(id: $id) {
        id
        ...RetroPGFApplicationBannerFragment
        ...RetroPGFApplicationContentFragment
      }
    }
  }
`;
/* eslint-enable relay/unused-fields, relay/must-colocate-fragment-spreads */

export const retroPGFApplicationRoute: RouteLoadingParams<RetroPGFApplicationPageRouteQuery> =
  {
    query,
    element: React.lazy(() => import("./RetroPGFApplicationPage")),
    variablesFromLocation(location, match) {
      return {
        id: match.params.applicationId as string,
      };
    },
  };
