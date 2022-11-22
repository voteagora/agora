import { Route } from "./HammockRouter";
import { homeRoute } from "../../pages/HomePage/HomePageRoute";
import { delegatePageRoute } from "../../pages/DelegatePage/DelegatePageRoute";
import { editDelegatePageRoute } from "../../pages/EditDelegatePage/EditDelegatePageRoute";

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
];
