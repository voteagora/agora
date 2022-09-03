import { useEthersProvider } from "../components/EthersProviderProvider";
import { useMemo } from "react";
import { NounsToken__factory } from "../contracts/generated";

export function useNounsToken() {
  const provider = useEthersProvider();

  return useMemo(
    () =>
      NounsToken__factory.connect(
        "0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03",
        provider
      ),
    [provider]
  );
}
