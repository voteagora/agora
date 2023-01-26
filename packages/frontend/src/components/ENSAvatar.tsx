import { useQuery } from "@tanstack/react-query";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { ENSAvatarFragment$key } from "./__generated__/ENSAvatarFragment.graphql";
import { SuspenseImage } from "./SuspenseImage/SuspenseImage";
import { useEnsAvatar } from "wagmi";
import { AvatarResolver } from "@ensdomains/ens-avatar";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { ethers } from "ethers";
import { TransparentMultiCallProvider } from "../multicallProvider";

type Props = {
  fragment: ENSAvatarFragment$key;
  className: string;
};

const ENSAvatarContext = createContext<TransparentMultiCallProvider | null>(
  null
);

type ProviderProps = {
  children: ReactNode;
};

export const ENSAvatarProvider = ({ children }: ProviderProps) => {
  const provider = useMemo(() => {
    const provider = new ethers.providers.AlchemyProvider(
      "mainnet",
      process.env.REACT_APP_ALCHEMY_ID
    );

    return new TransparentMultiCallProvider(provider);
  }, []);

  return (
    <ENSAvatarContext.Provider value={provider}>
      {children}
    </ENSAvatarContext.Provider>
  );
};

export function ENSAvatar({ fragment, className }: Props) {
  useEnsAvatar();
  const { name } = useFragment(
    graphql`
      fragment ENSAvatarFragment on ResolvedName {
        name
      }
    `,
    fragment
  );
  const provider = useContext(ENSAvatarContext);
  if (!provider) {
    throw new Error("missing provider");
  }

  const url = useQuery(
    ["ENSAvatar", name],
    async () => {
      if (!name) {
        return null;
      }

      const resolver = new AvatarResolver(provider);

      return await resolver.getAvatar(name, {});
    },
    {
      useErrorBoundary: false,
      suspense: false,
    }
  );

  return (
    <SuspenseImage src={url.data ?? null} className={className} name={name} />
  );
}
