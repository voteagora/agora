import { RouteLoadingParams } from "../../components/HammockRouter/HammockRouter";
import React from "react";
import { EditDelegatePageRouteQuery } from "./__generated__/EditDelegatePageRouteQuery.graphql";

export const editDelegatePageRoute: RouteLoadingParams<EditDelegatePageRouteQuery> =
  {
    element: React.lazy(() => import("./EditDelegatePage")),
  };
