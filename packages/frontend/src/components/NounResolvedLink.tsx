import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";

import { Link } from "./HammockRouter/Link";
import { NounResolvedName } from "./NounResolvedName";
import { NounResolvedLinkFragment$key } from "./__generated__/NounResolvedLinkFragment.graphql";

type Props = {
  resolvedName: NounResolvedLinkFragment$key;
  className?: string;
};

export function NounResolvedLink({ resolvedName, className }: Props) {
  const fragment = useFragment(
    graphql`
      fragment NounResolvedLinkFragment on ResolvedName {
        address
        name
        ...NounResolvedNameFragment
      }
    `,
    resolvedName
  );

  return (
    <Link
      to={`/delegate/${fragment.name ?? fragment.address}`}
      className={className}
    >
      <NounResolvedName resolvedName={fragment} />
    </Link>
  );
}
