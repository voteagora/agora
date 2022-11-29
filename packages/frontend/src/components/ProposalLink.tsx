import { ReactNode } from "react";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { ProposalLinkFragment$key } from "./__generated__/ProposalLinkFragment.graphql";
import { PROPOSALS_ENABLED } from "./HammockRouter/HammockRouter";
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

  if (PROPOSALS_ENABLED) {
    return <Link to={`/proposals/${proposal.number}`}>{children}</Link>;
  } else {
    return <a href={`https://nouns.wtf/vote/${proposal.number}`}>{children}</a>;
  }
}
