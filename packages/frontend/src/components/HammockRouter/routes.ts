import { Route } from "./HammockRouter";
import { homeRoute } from "../../pages/HomePage/HomePageRoute";
import { delegatePageRoute } from "../../pages/DelegatePage/DelegatePageRoute";
import { editDelegatePageRoute } from "../../pages/EditDelegatePage/EditDelegatePageRoute";
import React from "react";

export const routes: Route[] = [
  {
    path: "/",
    params: homeRoute,
  },
  {
    path: "/delegate/:delegateId",
    params: delegatePageRoute,
  },
  {
    path: "/create",
    params: editDelegatePageRoute,
  },
  {
    path: "/proposals/create",
    params: {
      element: React.lazy(
        () => import("../../pages/CreateProposalPage/CreateProposalPage")
      ),
    },
  },
  {
    path: "/proposals/:proposalId",
    params: {
      element: React.lazy(
        () => import("../../pages/ProposalsPage/ProposalsPage")
      ),
    },
  },
  {
    path: "/proposals",
    params: {
      element: React.lazy(
        () => import("../../pages/ProposalsListPage/ProposalsListPage")
      ),
    },
  },
];
