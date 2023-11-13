import { RetroPGFMetricsContainer } from "./RetroPGFMetricsContainer";
import { RetroPGFHero } from "./RetroPGFHero";
import { PageDivider } from "../../components/PageDivider";
import { RouteProps } from "../../components/HammockRouter/HammockRouter";
import { query } from "./RetroPGFRoute";
import { usePreloadedQuery } from "react-relay";
import { RetroPGFRouteQuery } from "./__generated__/RetroPGFRouteQuery.graphql";
import { RetroPGFProjectListContent } from "./RetroPGFProjectListContent";

export default function RetroPGFProjectListPage({
  initialQueryRef,
  variables,
}: RouteProps<RetroPGFRouteQuery>) {
  const result = usePreloadedQuery<RetroPGFRouteQuery>(query, initialQueryRef);

  return (
    <>
      <RetroPGFHero fragmentRef={result.retroPGF.projectsAggregate} />
      <RetroPGFMetricsContainer
        fragmentRef={result.retroPGF.projectsAggregate}
      />
      <PageDivider />
      <RetroPGFProjectListContent
        fragmentKey={result}
        listsFragmentKey={result}
        aggregateFragmentKey={result.retroPGF.projectsAggregate}
        variables={variables as any}
      />
    </>
  );
}
