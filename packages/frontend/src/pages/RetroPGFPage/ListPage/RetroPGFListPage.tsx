import RetroPGFListPageHeader from "./RetroPGFListPageHeader";
import { css } from "@emotion/css";
import { VStack } from "../../../components/VStack";
import * as theme from "../../../theme";
import { usePreloadedQuery } from "react-relay";
import { RetroPGFListContentPage } from "./RetroPGFListContentPage";
import { query } from "./RetroPGFListPageRoute";
import { RouteProps } from "../../../components/HammockRouter/HammockRouter";
import { RetroPGFListPageRouteQuery } from "./__generated__/RetroPGFListPageRouteQuery.graphql";
import { Navigate } from "../../../components/HammockRouter/Navigate";

export default function RetroPGFListPage({
  initialQueryRef,
}: RouteProps<RetroPGFListPageRouteQuery>) {
  const {
    retroPGF: { list },
  } = usePreloadedQuery<RetroPGFListPageRouteQuery>(query, initialQueryRef);

  if (!list) {
    return <Navigate to="/retropgf/3" />;
  }

  return (
    <VStack
      className={css`
        max-width: ${theme.maxWidth["6xl"]};
        width: 100%;
      `}
    >
      <RetroPGFListPageHeader fragmentRef={list} />
      <RetroPGFListContentPage fragmentRef={list} />
    </VStack>
  );
}
