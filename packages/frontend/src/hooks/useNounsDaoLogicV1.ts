import { useEthersProvider } from "../components/EthersProviderProvider";
import { useMemo } from "react";
import { NounsDAOLogicV1__factory } from "../contracts/generated";

export function useNounsDaoLogicV1() {
  const provider = useEthersProvider();

  return useMemo(
    () =>
      NounsDAOLogicV1__factory.connect(
        "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d",
        provider
      ),
    [provider]
  );
}
