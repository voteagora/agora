import { ReactNode } from "react";
import { useFragment, graphql } from "react-relay";

import { ProposalLinkFragment$key } from "./__generated__/ProposalLinkFragment.graphql";
import { Link } from "./HammockRouter/Link";

type Props = {
  fragmentRef: ProposalLinkFragment$key;
  children: ReactNode;
};

export function ProposalLink({ children, fragmentRef }: Props) {
  const proposal = useFragment(
    graphql`
      fragment ProposalLinkFragment on OnChainProposal {
        number
      }
    `,
    fragmentRef
  );

  return <Link to={`/proposals/${proposal.number}`}>{children}</Link>;
}
