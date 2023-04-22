import { css } from "@emotion/css";
import graphql from "babel-plugin-relay/macro";
import React from "react";
import { useFragment } from "react-relay";
import { Textfit } from "react-textfit";

import { icons } from "../../icons/icons";
import * as theme from "../../theme";
import { shortAddress } from "../../utils/address";
import { HStack, VStack } from "../VStack";

import { NameSectionFragment$key } from "./__generated__/NameSectionFragment.graphql";

type NameSectionProps = {
  resolvedName: NameSectionFragment$key;
};

export function NameSection({ resolvedName }: NameSectionProps) {
  const {
    address: {
      resolvedName: { address, name },
    },
    liquidDelegationProxy,
  } = useFragment(
    graphql`
      fragment NameSectionFragment on Delegate {
        address {
          resolvedName {
            address
            name
          }
        }

        liquidDelegationProxy {
          __typename
        }
      }
    `,
    resolvedName
  );

  const renderedAddress = shortAddress(address);

  return (
    <HStack alignItems="center" justifyContent="space-between" gap="2">
      <a href={etherscanAddressUrl(address)}>
        <VStack>
          {name && (
            <div
              className={css`
                color: #66676b;
                font-size: ${theme.fontSize.xs};
                font-weight: ${theme.fontWeight.medium};
                line-height: ${theme.lineHeight.relaxed};
              `}
            >
              {renderedAddress}
            </div>
          )}

          <div
            className={css`
              font-weight: ${theme.fontWeight.black};
              font-size: ${theme.fontSize["2xl"]};
              line-height: ${theme.lineHeight.tight};
              overflow: hidden;
            `}
          >
            <Textfit min={16} max={24} mode="single">
              {name ?? renderedAddress}
            </Textfit>
          </div>
        </VStack>
      </a>

      {liquidDelegationProxy && (
        <img
          src={icons.liquid}
          alt="liquid delegation proxy indicator"
          title="liquid delegation proxy"
          className={css`
            width: ${theme.spacing["4"]};
          `}
        />
      )}
    </HStack>
  );
}
export function etherscanAddressUrl(address: string) {
  return `https://etherscan.io/address/${address}`;
}
