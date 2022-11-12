import graphql from "babel-plugin-relay/macro";
import * as theme from "../theme";
import { useFragment } from "react-relay";
import { HStack, VStack } from "./VStack";
import { ENSAvatar } from "./ENSAvatar";
import { css } from "@emotion/css";
import { NounResolvedName } from "./NounResolvedName";
import { TokenAmountDisplay } from "./TokenAmountDisplay";
import { DelegateProfileImageFragment$key } from "./__generated__/DelegateProfileImageFragment.graphql";

export function DelegateProfileImage({
  fragment,
}: {
  fragment: DelegateProfileImageFragment$key;
}) {
  const delegate = useFragment(
    graphql`
      fragment DelegateProfileImageFragment on Delegate {
        address {
          resolvedName {
            address

            ...NounResolvedNameFragment
            ...ENSAvatarFragment
          }
        }

        tokensRepresented {
          amount {
            ...TokenAmountDisplayFragment
          }
        }
      }
    `,
    fragment
  );

  return (
    <HStack gap="4">
      <ENSAvatar
        className={css`
          width: 44px;
          height: 44px;
          border-radius: 100%;
        `}
        fragment={delegate.address.resolvedName}
      />

      <VStack>
        <div
          className={css`
            font-size: ${theme.fontSize.base};
            font-weight: ${theme.fontWeight.semibold};
          `}
        >
          <NounResolvedName resolvedName={delegate.address.resolvedName} />
        </div>
        <div
          className={css`
            font-size: ${theme.fontSize.xs};
            font-weight: ${theme.fontWeight.semibold};
            color: #4f4f4f;
          `}
        >
          <TokenAmountDisplay fragment={delegate.tokensRepresented.amount} />
        </div>
      </VStack>
    </HStack>
  );
}
