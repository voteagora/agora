import graphql from "babel-plugin-relay/macro";
import { ReactNode } from "react";
import { useFragment } from "react-relay";

import { Link } from "./HammockRouter/Link";
import { ProposalLinkFragment$key } from "./__generated__/ProposalLinkFragment.graphql";

type Props = {
  fragmentRef: ProposalLinkFragment$key;
  children: ReactNode;
};

export function ProposalLink({ children, fragmentRef }: Props) {
  const proposal = useFragment(
    graphql`
      fragment ProposalLinkFragment on Proposal {
        number
      }
    `,
    fragmentRef
  );

  return <Link to={`/proposals/${proposal.number}`}>{children}</Link>;
}
