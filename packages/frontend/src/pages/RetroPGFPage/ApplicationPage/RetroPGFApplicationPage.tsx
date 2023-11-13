import { usePreloadedQuery } from "react-relay";
import { RetroPGFApplicationBanner } from "./RetroPGFApplicationBanner";
import { RetroPGFApplicationContent } from "./RetroPGFApplicationContent";
import { RetroPGFApplicationPageRouteQuery } from "./__generated__/RetroPGFApplicationPageRouteQuery.graphql";
import { RouteProps } from "../../../components/HammockRouter/HammockRouter";
import { Navigate } from "../../../components/HammockRouter/Navigate";
import { query } from "./RetroPGFApplicationPageRoute";

export default function RetroPGFApplicationPage({
  initialQueryRef,
}: RouteProps<RetroPGFApplicationPageRouteQuery>) {
  const {
    retroPGF: { project },
  } = usePreloadedQuery<RetroPGFApplicationPageRouteQuery>(
    query,
    initialQueryRef
  );

  if (!project) {
    return <Navigate to="/retropgf/3" />;
  }

  return (
    <div>
      <RetroPGFApplicationBanner fragmentRef={project} />
      <RetroPGFApplicationContent fragmentRef={project} />
    </div>
  );
}
