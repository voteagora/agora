import graphql from "babel-plugin-relay/macro";
import { RouteLoadingParams } from "../../components/HammockRouter/HammockRouter";
import React from "react";
import { EditDelegatePageRouteQuery } from "./__generated__/EditDelegatePageRouteQuery.graphql";

export const editDelegateQuery = graphql`
  query EditDelegatePageRouteQuery($address: String!) {
    ...DelegateStatementFormFragment @arguments(address: $address)

    delegate(addressOrEnsName: $address) {
      ...VoterPanelFragment
    }
  }
`;

export const editDelegatePageRoute: RouteLoadingParams<EditDelegatePageRouteQuery> =
  {
    query: editDelegateQuery,
    element: React.lazy(() => import("./EditDelegatePage")),
    variablesFromLocation(location) {
      return {
        // todo: value?
        address: "",
      };
    },
  };
