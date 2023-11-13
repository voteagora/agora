import graphql from "babel-plugin-relay/macro";
import * as theme from "../theme";
import { useFragment } from "react-relay";
import { HStack, VStack } from "./VStack";
import { ENSAvatar } from "./ENSAvatar";
import { css } from "@emotion/css";
import { NounResolvedName } from "./NounResolvedName";
import { TokenAmountDisplay } from "./TokenAmountDisplay";
import { DelegateProfileImageFragment$key } from "./__generated__/DelegateProfileImageFragment.graphql";
import { icons } from "../icons/icons";

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

        isCitizen
      }
    `,
    fragment
  );

  return (
    <HStack gap="4">
      <div
        className={css`
          position: relative;
          aspect-ratio: 1/1;
        `}
      >
        {delegate.isCitizen && (
          <img
            className={css`
              position: absolute;
              bottom: -5px;
              right: -7px;
              z-index: 1;
            `}
            src={icons.badge}
            alt="badge symbol"
          />
        )}
        <ENSAvatar
          className={css`
            width: 44px;
            height: 44px;
            border-radius: 100%;
          `}
          fragment={delegate.address.resolvedName}
        />
      </div>

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
