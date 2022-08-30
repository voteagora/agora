import { useQuery } from "@tanstack/react-query";
import {
  lookupNounNameServiceOrEthereumNameServiceName,
  shortAddress,
} from "../utils/address";
import { providers } from "ethers";

type Props = {
  address: string;
};

export function NounResolvedName({ address }: Props) {
  const { data } = useQuery(["noun-name", address.toLowerCase()], async () => {
    const provider = new providers.Web3Provider((window as any).ethereum);
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
