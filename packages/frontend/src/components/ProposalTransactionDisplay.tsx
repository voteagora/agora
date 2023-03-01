import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { BigNumber, ethers } from "ethers";
import * as theme from "../theme";
import { etherscanAddressUrl } from "./VoterPanel/NameSection";
import { ProposalTransactionDisplayFragment$key } from "./__generated__/ProposalTransactionDisplayFragment.graphql";
import { css } from "@emotion/css";
import { useMemo } from "react";
import * as Sentry from "@sentry/react";
import { VStack } from "./VStack";

export function ProposalTransactionDisplay({
  fragment,
}: {
  fragment: ProposalTransactionDisplayFragment$key;
}) {
  const proposalTransaction = useFragment(
    graphql`
      fragment ProposalTransactionDisplayFragment on ProposalTransaction {
        target {
          resolvedName {
            address
            name
          }
        }

        calldata
        signature
        value
      }
    `,
    fragment
  );

  const decodingMetadata = useMemo(() => {
    try {
      const functionFragment = ethers.utils.FunctionFragment.fromString(
        proposalTransaction.signature
      );

      const decoded = ethers.utils.defaultAbiCoder.decode(
        functionFragment.inputs,
        proposalTransaction.calldata
      );

      return {
        functionFragment,
        values: functionFragment.inputs.map((type, index) => ({
          type,
          value: decoded[index],
        })),
      };
    } catch (e) {
      Sentry.captureException(e);
      return null;
    }
  }, [proposalTransaction]);

  return (
    <div
      className={css`
        word-break: break-word;
        font-size: ${theme.fontSize.xs};
        font-family: ${theme.fontFamily.mono};
        font-weight: ${theme.fontWeight.medium};
        color: ${theme.colors.gray["4f"]};
        line-height: ${theme.lineHeight["4"]};
        margin-top: ${theme.spacing[2]};
        margin-bottom: ${theme.spacing[2]};
      `}
    >
      <a
        className={css`
          text-decoration: underline;
        `}
        href={etherscanAddressUrl(
          proposalTransaction.target.resolvedName.address
        )}
      >
        {(() => {
          if (proposalTransaction.target.resolvedName.name) {
            return proposalTransaction.target.resolvedName.name;
          } else {
            return proposalTransaction.target.resolvedName.address;
          }
        })()}
      </a>
      {(() => {
        const value = BigNumber.from(proposalTransaction.value);
        if (value.isZero()) {
          return;
        }

        return <> ( value: {ethers.utils.formatEther(value)} ETH )</>;
      })()}
      <VStack
        className={css`
          margin-left: ${theme.spacing["4"]};
        `}
      >
        {(() => {
          if (!decodingMetadata) {
            if (proposalTransaction.calldata === "0x") {
              return null;
            }

            return (
              <>
                calldata:
                <VStack
                  className={css`
                    margin-left: ${theme.spacing["4"]};
                  `}
                >
                  {proposalTransaction.calldata}
                </VStack>
              </>
            );
          }

          return (
            <>
              .{decodingMetadata.functionFragment.name}(
              <VStack
                className={css`
                  margin-left: ${theme.spacing["4"]};
                `}
              >
                {decodingMetadata.values.map((it, idx) => (
                  <EncodedValueDisplay
                    key={idx}
                    type={it.type}
                    value={it.value}
                  />
                ))}
              </VStack>
              )
            </>
          );
        })()}
      </VStack>
    </div>
  );
}

function EncodedValueDisplay({
  type,
  value,
}: {
  type: ethers.utils.ParamType;
  value: any;
}) {
  switch (type.type) {
    case "address":
      return (
        <a
          className={css`
            text-decoration: underline;
          `}
          href={etherscanAddressUrl(value)}
        >
          {value}
        </a>
      );

    case "tuple":
      return (
        <VStack
          className={css`
            margin-left: ${theme.spacing["4"]};
          `}
        >
          {type.components.map((compoment, idx) => (
            <EncodedValueDisplay
              key={idx}
              type={compoment}
              value={value[idx]}
            />
          ))}
        </VStack>
      );

    default:
    case "string":
    case "uint16":
    case "uint32":
    case "uint64":
    case "uint128":
    case "uint256":
      return <div>{value.toString()}</div>;
  }
}
