import React from "react";

import { proposalsListPageRoute } from "../../pages/ProposalsListPage/ProposalsListPageRoute";
import { homePageRoute } from "../../pages/HomePage/HomePageRoute";
import { delegatePageRoute } from "../../pages/DelegatePage/DelegatePageRoute";

import { Route } from "./HammockRouter";

export const routes: Route[] = [
  {
    path: "/oops",
    params: {
      element: React.lazy(() => import("../../pages/OopsPage/OopsPage")),
    },
  },
  {
    path: "/",
    params: proposalsListPageRoute,
  },
  {
    path: "/voters",
    params: homePageRoute,
  },
  {
    path: "/delegate/:delegateId",
    params: delegatePageRoute,
  },
  {
    path: "/voteauction",
    params: {
      element: React.lazy(
        () => import("../../pages/VoteAuctionPage/VoteAuctionPage")
      ),
    },
  },
  {
    path: "/create",
    params: {
      element: React.lazy(
        () => import("../../pages/EditDelegatePage/EditDelegatePage")
      ),
    },
  },
  {
    path: "/proposals",
    params: proposalsListPageRoute,
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
    path: "/auctions/:auctionId",
    params: {
      element: React.lazy(
        () => import("../../pages/PropHouseAuctionPage/PropHouseAuctionPage")
      ),
    },
  },
];
