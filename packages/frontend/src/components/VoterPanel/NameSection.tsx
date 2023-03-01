import { useFragment } from "react-relay";
import * as theme from "../../theme";
import graphql from "babel-plugin-relay/macro";
import { NameSectionFragment$key } from "./__generated__/NameSectionFragment.graphql";
import { shortAddress } from "../../utils/address";
import React from "react";
import { VStack } from "../VStack";
import { css } from "@emotion/css";
import { Textfit } from "react-textfit";

type NameSectionProps = {
  resolvedName: NameSectionFragment$key;
};

export function NameSection({ resolvedName }: NameSectionProps) {
  const { address, name } = useFragment(
    graphql`
      fragment NameSectionFragment on ResolvedName {
        address
        name
      }
    `,
    resolvedName
  );

  const renderedAddress = shortAddress(address);

  return (
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
  );
}
export function etherscanAddressUrl(address: string) {
  return `https://etherscan.io/address/${address}`;
}
