import { useFragment, graphql } from "react-relay";

import { shortAddress } from "../utils/address";

import { NounResolvedNameFragment$key } from "./__generated__/NounResolvedNameFragment.graphql";

type Props = {
  resolvedName: NounResolvedNameFragment$key;
};

export function NounResolvedName({ resolvedName }: Props) {
  const { address, name } = useFragment(
    graphql`
      fragment NounResolvedNameFragment on ResolvedName {
        address
        name
      }
    `,
    resolvedName
  );

  if (!name) {
    return <>{shortAddress(address)}</>;
  }

  return <>{name}</>;
}
