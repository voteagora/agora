import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import { DelegateProfileImageFragment$key } from "./__generated__/DelegateProfileImageFragment.graphql";
import { NounsRepresentedGrid } from "./NounGrid";
import * as theme from "../theme";
import { HStack, VStack } from "./VStack";
import { useEnsAvatar } from "wagmi";
import { icons } from "../icons/icons";

type Props = {
  fragment: DelegateProfileImageFragment$key;
  dense?: boolean;
};

export function DelegateProfileImage({ fragment, dense }: Props) {
  const delegate = useFragment(
    graphql`
      fragment DelegateProfileImageFragment on WrappedDelegate {
        address {
          resolvedName {
            address
          }
        }
        delegate {
          nounsRepresented {
            id
          }

          ...NounGridFragment
        }
      }
    `,
    fragment
  );

  const avatar = useEnsAvatar({
    addressOrName: delegate.address.resolvedName.address,
  });

  return !delegate.delegate ? (
    <HStack
      alignItems="center"
      className={css`
        border-radius: ${theme.borderRadius.full};
        border: 1px solid ${theme.colors.gray.eb};
        box-shadow: ${theme.boxShadow.newDefault};
        margin: ${theme.spacing["4"]} 0;
      `}
    >
      <img
        className={css`
          width: 44px;
          height: 44px;
          border-radius: 100%;
        `}
        src={avatar.data || icons.anonNoun}
        alt={"anon noun"}
      />
      <div
        className={css`
          font-size: ${theme.fontSize.sm};
          font-weight: ${theme.fontWeight.semibold};
          padding: 0 ${theme.spacing["4"]};
        `}
      >
        Currently seeking delegation
      </div>
    </HStack>
  ) : !delegate.delegate.nounsRepresented.length ? (
    <VStack
      justifyContent="center"
      alignItems="center"
      className={css`
        color: #afafaf;
        min-height: 44px;
        font-size: ${theme.fontSize.sm};
        margin: 0 ${theme.spacing["10"]};
        border-radius: ${theme.borderRadius.full};
        border: 1px solid ${theme.colors.gray.eb};
        box-shadow: ${theme.boxShadow.newDefault};
        margin: ${theme.spacing["4"]} 0;
        width: 100%;
      `}
    >
      No longer has votes
    </VStack>
  ) : (
    <NounsRepresentedGrid
      rows={3}
      columns={dense ? 6 : 5}
      gap={dense ? "2" : "4"}
      imageSize={dense ? "10" : "12"}
      overflowFontSize="base"
      fragmentKey={delegate.delegate}
    />
  );
}
