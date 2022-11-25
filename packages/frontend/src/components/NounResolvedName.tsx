import { shortAddress, shortENS } from "../utils/address";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { NounResolvedNameFragment$key } from "./__generated__/NounResolvedNameFragment.graphql";

type Props = {
  resolvedName: NounResolvedNameFragment$key;
  dense?: boolean;
};

export function NounResolvedName({ resolvedName, dense }: Props) {
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

  return <>{dense ? shortENS(name) : name}</>;
}
