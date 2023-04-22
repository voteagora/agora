import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { NounResolvedLinkFragment$key } from "./__generated__/NounResolvedLinkFragment.graphql";
import { NounResolvedName } from "./NounResolvedName";
import { Link } from "./HammockRouter/Link";

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
