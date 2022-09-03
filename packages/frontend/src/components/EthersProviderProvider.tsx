import { createContext, ReactNode, useContext, useState } from "react";
import { providers } from "ethers";
import { useQuery } from "@tanstack/react-query";

const EthersProvider = createContext<providers.Web3Provider | null>(null);
const AccountsProvider = createContext<string[]>([]);

type Props = {
  children: ReactNode;
};

export function EthersProviderProvider({ children }: Props) {
  const [provider] = useState(
    () => new providers.Web3Provider((window as any).ethereum)
  );

  const accounts = useQuery(
    ["accounts"],
    async () => await provider.send("eth_requestAccounts", [])
  );

  if (!accounts.data) {
    return null;
  }

  return (
    <AccountsProvider.Provider value={accounts.data}>
      <EthersProvider.Provider value={provider}>
        {children}
      </EthersProvider.Provider>
    </AccountsProvider.Provider>
  );
}

export function useEthersProvider(): providers.Web3Provider {
  const value = useContext(EthersProvider);
  if (!value) {
    throw new Error("ethers provider missing");
  }

  return value;
}

export function usePrimaryAccount(): string {
  const accounts = useContext(AccountsProvider);
  if (!accounts.length) {
    throw new Error("no account linked!");
  }

  return accounts[0];
}
