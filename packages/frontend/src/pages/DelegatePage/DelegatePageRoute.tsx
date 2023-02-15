import { RouteLoadingParams } from "../../components/HammockRouter/HammockRouter";
import React from "react";
import graphql from "babel-plugin-relay/macro";
import { DelegatePageRouteQuery } from "./__generated__/DelegatePageRouteQuery.graphql";

/* eslint-disable relay/unused-fields, relay/must-colocate-fragment-spreads */
export const query = graphql`
  query DelegatePageRouteQuery($addressOrEnsName: String!) {
    delegate(addressOrEnsName: $addressOrEnsName) {
      ...VoterPanelFragment

      statement {
        ...StatementSectionFragment

        ...TopIssuesFragment
        ...ImpactfulProposalsFragment
      }

      ...PastVotesFragment
    }
  }
`;
/* eslint-enable relay/unused-fields, relay/must-colocate-fragment-spreads */

export const delegatePageRoute: RouteLoadingParams<DelegatePageRouteQuery> = {
  query,
  element: React.lazy(() => import("./DelegatePage")),
  variablesFromLocation(location, match) {
    return {
      addressOrEnsName: match.params.delegateId as string,
    };
  },
};
