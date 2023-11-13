import React from "react";
import graphql from "babel-plugin-relay/macro";
import { RouteLoadingParams } from "../../../components/HammockRouter/HammockRouter";
import { RetroPGFListPageRouteQuery } from "./__generated__/RetroPGFListPageRouteQuery.graphql";

/* eslint-disable relay/unused-fields, relay/must-colocate-fragment-spreads */
export const query = graphql`
  query RetroPGFListPageRouteQuery($id: ID!) {
    retroPGF {
      list(id: $id) {
        listContent {
          project {
            id
          }
          OPAmount
        }

        ...RetroPGFListContentPageFragment
        ...RetroPGFListPageHeaderFragment
      }
    }
  }
`;
/* eslint-enable relay/unused-fields, relay/must-colocate-fragment-spreads */

export const retroPGFListPageRoute: RouteLoadingParams<RetroPGFListPageRouteQuery> =
  {
    query,
    element: React.lazy(() => import("./RetroPGFListPage")),
    variablesFromLocation(location, match) {
      return {
        id: match.params.listId as string,
      };
    },
  };
