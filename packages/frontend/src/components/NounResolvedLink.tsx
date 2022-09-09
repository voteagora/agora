import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { NounResolvedLinkFragment$key } from "./__generated__/NounResolvedLinkFragment.graphql";
import { NounResolvedName } from "./NounResolvedName";

type Props = {
  resolvedName: NounResolvedLinkFragment$key;
  className?: string;
};

export function NounResolvedLink({ resolvedName, className }: Props) {
  const fragment = useFragment(
    graphql`
      fragment NounResolvedLinkFragment on ResolvedName {
        address
        ...NounResolvedNameFragment
      }
    `,
    resolvedName
  );

  return (
    <a
      href={`https://etherscan.io/address/${fragment.address}`}
      className={className}
    >
      <NounResolvedName resolvedName={fragment} />
    </a>
  );
}
