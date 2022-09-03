import { useQuery } from "@tanstack/react-query";
import {
  lookupNounNameServiceOrEthereumNameServiceName,
  shortAddress,
} from "../utils/address";
import { useEthersProvider } from "./EthersProviderProvider";

type Props = {
  address: string;
};

export function NounResolvedName({ address }: Props) {
  const provider = useEthersProvider();

  const { data } = useQuery(["noun-name", address.toLowerCase()], async () => {
    return await lookupNounNameServiceOrEthereumNameServiceName(
      provider,
      address
    );
  });

  if (!data) {
    return <>{shortAddress(address)}</>;
  }

  return <>{data}</>;
}
