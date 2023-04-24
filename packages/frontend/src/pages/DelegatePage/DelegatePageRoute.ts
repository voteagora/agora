import { graphql } from "react-relay";
import React from "react";

import { RouteLoadingParams } from "../../components/HammockRouter/HammockRouter";

import { DelegatePageRouteQuery } from "./__generated__/DelegatePageRouteQuery.graphql";

export const query = graphql`
  query DelegatePageRouteQuery($addressOrEnsName: String!) {
    delegate(addressOrEnsName: $addressOrEnsName) {
      ...VoterPanelFragment
      ...PastVotesFragment

      statement {
        statement

        ...ImpactfulProposalsFragment
        ...TopIssuesFragment
      }
    }
  }
`;

export const delegatePageRoute: RouteLoadingParams<DelegatePageRouteQuery> = {
  query,
  element: React.lazy(() => import("./DelegatePage")),
  variablesFromLocation(location, match) {
    return {
      addressOrEnsName: match.params.delegateId ?? "",
    };
  },
};
