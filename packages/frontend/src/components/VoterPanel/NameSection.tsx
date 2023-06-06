import { useFragment, graphql } from "react-relay";
import { css } from "@emotion/css";
import { Textfit } from "react-textfit";

import { HStack, VStack } from "../VStack";
import { shortAddress } from "../../utils/address";
import * as theme from "../../theme";
import { icons } from "../../icons/icons";
import { Tooltip } from "../../components/Tooltip";

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
    <VStack>
      {(name || liquidDelegationProxy) && (
        <a href={etherscanAddressUrl(address)} target="_blank" rel="noreferrer">
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
        </a>
      )}

      <HStack justifyContent="space-between" gap="2">
        <a href={etherscanAddressUrl(address)} target="_blank" rel="noreferrer">
          <div
            className={css`
              font-weight: ${theme.fontWeight.black};
              font-size: ${theme.fontSize["2xl"]};
              line-height: ${theme.lineHeight.tight};
              overflow: hidden;
            `}
          >
            <Textfit min={16} max={24} mode="single">
              {liquidDelegationProxy
                ? "Delegation Proxy"
                : name ?? renderedAddress}
            </Textfit>
          </div>
        </a>

        {liquidDelegationProxy && (
          <div
            className={css`
              position: relative;

              &:hover > #tooltip {
                visibility: visible;
              }
            `}
          >
            <img
              src={icons.info}
              alt="liquid delegation proxy indicator"
              className={css`
                width: ${theme.spacing["4"]};
              `}
            />

            <Tooltip
              text={LIQUID_DELEGATION_TOOLTIP_TEXT}
              className={css`
                right: 0;
                font-size: ${theme.fontSize.xs};
              `}
            />
          </div>
        )}
      </HStack>
    </VStack>
  );
}
export function etherscanAddressUrl(address: string) {
  return `https://etherscan.io/address/${address}`;
}

const LIQUID_DELEGATION_TOOLTIP_TEXT = (
  <>
    This address is a liquid delegation contract, and <br /> votes on behalf of
    potentially multiple <br /> delegates.
  </>
);
