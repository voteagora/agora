import { css } from "@emotion/css";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { Markdown } from "../../components/Markdown";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { ProposalDetailPanelFragment$key } from "./__generated__/ProposalDetailPanelFragment.graphql";
import { ProposalDetailPanelCodeChangesFragment$key } from "./__generated__/ProposalDetailPanelCodeChangesFragment.graphql";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { utils, BigNumber } from "ethers";
import { defaultAbiCoder, Result } from "ethers/lib/utils";

export function ProposalDetailPanel({
  fragmentRef,
}: {
  fragmentRef: ProposalDetailPanelFragment$key;
}) {
  const result = useFragment(
    graphql`
      fragment ProposalDetailPanelFragment on Proposal {
        title
        description
        proposer {
          address {
            resolvedName {
              ...NounResolvedLinkFragment
              address
            }
          }
        }
        ...ProposalDetailPanelCodeChangesFragment
      }
    `,
    fragmentRef
  );
  const { title, description, proposer } = result;

  return (
    <>
      <VStack
        gap="4"
        className={css`
          width: ${theme.maxWidth["3xl"]};
          @media (max-width: ${theme.maxWidth["lg"]}) {
            width: auto;
          }
        `}
      >
        <HStack
          justifyContent="space-between"
          alignItems="center"
          className={css`
            @media (max-width: ${theme.maxWidth["lg"]}) {
              flex-direction: column-reverse;
              align-items: flex-start;
            }
          `}
        >
          <h2
            className={css`
              font-size: ${theme.fontSize["2xl"]};
              font-weight: ${theme.fontWeight.black};
            `}
          >
            {title}
          </h2>
          <div
            className={css`
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.semibold};
              color: ${theme.colors.gray[700]};
            `}
          >
            by &nbsp;
            <NounResolvedLink resolvedName={proposer.address.resolvedName} />
          </div>
        </HStack>
        <VStack gap="2">
          <CodeChanges fragmentRef={result} />
          <Markdown markdown={stripTitleFromDescription(title, description)} />
        </VStack>
      </VStack>
    </>
  );
}

function CodeChanges({
  fragmentRef,
}: {
  fragmentRef: ProposalDetailPanelCodeChangesFragment$key;
}) {
  const { targets, signatures, calldatas, values } = useFragment(
    graphql`
      fragment ProposalDetailPanelCodeChangesFragment on Proposal {
        targets
        signatures
        calldatas
        values
      }
    `,
    fragmentRef
  );

  return (
    <VStack
      gap="1"
      className={css`
        /* border: 1px solid #e0e0e0; */
        border-radius: ${theme.borderRadius.lg};
        padding: ${theme.spacing["4"]};
        background-color: #f7f7f7;
      `}
    >
      <div
        className={css`
          font-size: ${theme.fontSize.xs};
          font-weight: ${theme.fontWeight.medium};
          color: ${theme.colors.gray.af};
        `}
      >
        Proposed Transactions
      </div>
      <VStack>
        {targets &&
          targets.map((target, idx) => {
            return (
              <CodeChange
                key={idx}
                target={target}
                signature={signatures?.[idx]}
                calldata={calldatas?.[idx]}
                value={values?.[idx]!}
              />
            );
          })}
      </VStack>
    </VStack>
  );
}

// todo: clean up this
function CodeChange({
  target,
  signature,
  calldata,
  value,
}: {
  target: string;
  signature?: string;
  calldata: string;
  value: string;
}) {
  const [name, types] =
    signature?.substring(0, signature.length - 1)?.split("(") ?? [];

  let functionSig: string, callData: Result, valueAmount: string | undefined;
  if (!name || !types) {
    functionSig =
      name === "" ? "transfer" : name === undefined ? "unknown" : name;
    callData = types
      ? [types]
      : value
      ? [`${utils.formatEther(value)} ETH`]
      : [];
  } else {
    const valueBN = BigNumber.from(value);
    callData = defaultAbiCoder
      .decode(types.split(","), calldata)
      .join(",")
      .split(",");
    functionSig = name;
    valueAmount = valueBN.gt(0)
      ? `{ value: ${utils.formatEther(valueBN)} ETH }`
      : undefined;
  }
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
      {linkIfAddress(target)}.{functionSig}
      {valueAmount}(
      <br />
      {callData.map((content, idx) => {
        return (
          <div key={idx}>
            <span>&emsp;{linkIfAddress(content)},</span>
            <br />
          </div>
        );
      })}
      )
    </div>
  );
}

function linkIfAddress(content: string) {
  // TODO: This doesn't handle ENS addresses
  if (utils.isAddress(content)) {
    return (
      <a
        href={`https://etherscan.io/address/${content}`}
        target="_blank"
        rel="noreferrer"
      >
        {content}
      </a>
    );
  }
  return <span>{content}</span>;
}

function stripTitleFromDescription(title: string, description: string) {
  // TODO: This is very fragile. Consider using a regex instead?
  if (description.startsWith(`# ${title}\n`)) {
    const newDescription = description.slice(`# ${title}\n`.length).trim();
    return newDescription;
  }
  return description;
}
