import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { HomePageQuery } from "./__generated__/HomePageQuery.graphql";

const pageSize = 100;

export function HomePage() {
  const pageNumber = 0;

  const query = useLazyLoadQuery<HomePageQuery>(
    graphql`
      query HomePageQuery($pageSize: Int!, $skip: Int) {
        delegates(
          first: $pageSize
          skip: $skip
          orderBy: delegatedVotes
          orderDirection: desc
        ) {
          id
        }
      }
    `,
    {
      pageSize,
      skip: pageSize * pageNumber,
    }
  );

  return <pre>{JSON.stringify(query, undefined, "\t")}</pre>;
}
