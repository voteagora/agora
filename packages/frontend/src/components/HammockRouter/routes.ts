import { Route } from "./HammockRouter";
import { homeRoute } from "../../pages/HomePage/HomePageRoute";
import { delegatePageRoute } from "../../pages/DelegatePage/DelegatePageRoute";
import { editDelegatePageRoute } from "../../pages/EditDelegatePage/EditDelegatePageRoute";
import React from "react";
import { retroPGFRoute } from "../../pages/RetroPGFPage/RetroPGFRoute";
import { retroPGFApplicationRoute } from "../../pages/RetroPGFPage/ApplicationPage/RetroPGFApplicationPageRoute";
import { retroPGFListPageRoute } from "../../pages/RetroPGFPage/ListPage/RetroPGFListPageRoute";

export const routes: Route[] = [
  {
    path: "/oops",
    params: {
      element: React.lazy(() => import("../../pages/OopsPage/OopsPage")),
    },
  },
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
  {
    path: "/retropgf/3",
    params: retroPGFRoute,
  },
  {
    path: "/retropgf/3/application/:applicationId",
    params: retroPGFApplicationRoute,
  },
  {
    path: "/retropgf/3/ballot",
    params: {
      element: React.lazy(
        () => import("../../pages/RetroPGFPage/BallotPage/RetroPGFBallotPage")
      ),
    },
  },
  {
    path: "/retropgf/3/list/:listId",
    params: retroPGFListPageRoute,
  },
];
