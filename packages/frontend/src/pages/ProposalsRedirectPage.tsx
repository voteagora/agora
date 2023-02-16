import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { useTransition } from "react";
import { useNavigate } from "../components/HammockRouter/HammockRouter";
import { ProposalsRedirectPageQuery } from "./__generated__/ProposalsRedirectPageQuery.graphql";

export function ProposalsRedirectPage() {
  const result = useLazyLoadQuery<ProposalsRedirectPageQuery>(
    graphql`
      query ProposalsRedirectPageQuery {
        proposals(orderBy: createdBlock, orderDirection: desc, first: 1) {
          number
        }
      }
    `,
    {}
  );
  const [, startTransition] = useTransition();
  const navigate = useNavigate();
  const proposals = result.proposals;
  // TODO: Show a 404 or something indicating that there are no proposals
  // For now, just send back to home page
  if (proposals.length === 0) {
    startTransition(() => {
      navigate({ path: `/` });
    });
  }
  startTransition(() => {
    navigate({ path: `/proposals/${proposals[0].number}` });
  });
}
