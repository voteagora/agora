import { ReactNode } from "react";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { ProposalLinkFragment$key } from "./__generated__/ProposalLinkFragment.graphql";
import { Link } from "./HammockRouter/Link";

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
