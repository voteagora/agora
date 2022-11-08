import { useQuery } from "@tanstack/react-query";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { ENSAvatarFragment$key } from "./__generated__/ENSAvatarFragment.graphql";
import { SuspenseImage } from "./SuspenseImage";
import { useEnsAvatar, useProvider } from "wagmi";
import { AvatarResolver } from "@ensdomains/ens-avatar";

type Props = {
  fragment: ENSAvatarFragment$key;
  className: string;
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

  const provider = useProvider();

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

  return <SuspenseImage src={url.data ?? null} className={className} />;
}
