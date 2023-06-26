import { useFragment, graphql } from "react-relay";
import { css } from "@emotion/css";
import { Textfit } from "react-textfit";
import { useEnsAvatar } from "wagmi";

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
  const avatar = useEnsAvatar({
    address: address as any,
  });
  const isGovernancePool =
    address === "0x6b2645b468A828a12fEA8C7D644445eB808Ec2B1";

  return (
    <HStack gap="3" alignItems="center">
      {isGovernancePool || liquidDelegationProxy ? (
        <img
          className={css`
            width: 40px;
            height: 40px;
            border-radius: ${theme.borderRadius.lg};
          `}
          src={icons.contractVoter}
          alt={"anon noun"}
        />
      ) : (
        <img
          className={css`
            width: 40px;
            height: 40px;
            border-radius: ${theme.borderRadius.lg};
          `}
          src={avatar.data || icons.anonNoun}
          alt={"anon noun"}
        />
      )}
      <VStack>
        {(name || liquidDelegationProxy || isGovernancePool) && (
          <a
            href={etherscanAddressUrl(address)}
            target="_blank"
            rel="noreferrer"
          >
            <div
              className={css`
                color: #66676b;
                font-size: ${theme.fontSize.xs};
                font-weight: ${theme.fontWeight.medium};
                line-height: ${theme.lineHeight.tight};
              `}
            >
              {renderedAddress}
            </div>
          </a>
        )}

        <HStack justifyContent="space-between" gap="2">
          <a
            href={etherscanAddressUrl(address)}
            target="_blank"
            rel="noreferrer"
          >
            <div
              className={css`
                font-weight: ${theme.fontWeight.extrabold};
                font-size: ${theme.fontSize["xl"]};
                line-height: ${theme.lineHeight.tight};
                overflow: hidden;
              `}
            >
              <Textfit min={16} max={24} mode="single">
                {isGovernancePool
                  ? "Governance Pool"
                  : liquidDelegationProxy
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

          {isGovernancePool && (
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
                text={POOL_TOOLTIP_TEXT}
                className={css`
                  right: 0;
                  background-color: ${theme.colors.gray[900]};
                  font-size: ${theme.fontSize.xs};
                  font-weight: ${theme.fontWeight.medium};
                  padding: ${theme.spacing["3"]};
                `}
              />
            </div>
          )}
        </HStack>
      </VStack>
    </HStack>
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

const POOL_TOOLTIP_TEXT = (
  <>
    This address is a governance pool contract, and <br /> votes on behalf of of
    the highest bidder.{" "}
    <a href="https://www.federation.wtf/governance-pools" target="_BLANK">
      Learn more
    </a>
  </>
);
