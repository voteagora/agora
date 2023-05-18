import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { VStack } from "../../../components/VStack";
import { Markdown } from "../../../components/Markdown";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { NounResolvedLink } from "../../../components/NounResolvedLink";
import { utils, BigNumber } from "ethers";
import { ProposalDetailPanelFragment$key } from "../__generated__/ProposalDetailPanelFragment.graphql";
import { ProposalDetailPanelFragment } from "../ProposalDetailPanel";
import { ApprovalProposalDetailPanelCodeChangesFragment$key } from "./__generated__/ApprovalProposalDetailPanelCodeChangesFragment.graphql";
import { useState } from "react";

export function ApprovalProposalDetailPanel({
  fragmentRef,
  codeChangesFragment,
}: {
  fragmentRef: ProposalDetailPanelFragment$key;
  codeChangesFragment: ApprovalProposalDetailPanelCodeChangesFragment$key;
}) {
  const result = useFragment(ProposalDetailPanelFragment, fragmentRef);
  const { title, number, description, proposer } = result;

  const proposalsWithBadDescription = [
    "94365805422398770067924881378455503928423439630602149628781926844759467250082",
    "64930538748268257621925093712454552173772860987977453334165023026835711650357",
    "51738314696473345172141808043782330430064117614433447104828853768775712054864",
    "32970701904870446614408373011942917680422376755229075190214017021915019093516",
    "103695324913424597802389181312722993037601032681914451632412140667432224173014",
  ];

  // This is a hack to hide a proposal formatting mistake from the OP Foundation
  const proposalsWithBadFormatting = [
    "114732572201709734114347859370226754519763657304898989580338326275038680037913",
    "27878184270712708211495755831534918916136653803154031118511283847257927730426",
    "90839767999322802375479087567202389126141447078032129455920633707568400402209",
  ];
  const patchedDescription = proposalsWithBadDescription.includes(number)
    ? description.split("\\n ")[1]
    : description;

  const shortTitle = proposalsWithBadFormatting.includes(number)
    ? title.split("-")[0].split("(")[0]
    : title;
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
        <VStack
          className={css`
            flex-direction: column-reverse;
            align-items: flex-start;
          `}
        >
          <h2
            className={css`
              font-size: ${theme.fontSize["2xl"]};
              font-weight: ${theme.fontWeight.black};
            `}
          >
            {shortTitle}
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
        </VStack>
        <VStack gap="2">
          <ApprovalCodeChanges fragmentRef={codeChangesFragment} />
          <div>
            <Markdown
              markdown={stripTitleFromDescription(title, patchedDescription)}
            />
          </div>
        </VStack>
      </VStack>
    </>
  );
}

function ApprovalCodeChanges({
  fragmentRef,
}: {
  fragmentRef: ApprovalProposalDetailPanelCodeChangesFragment$key;
}) {
  const [displayedOptions, setDisplayedOptions] = useState(1);
  const proposalData = useFragment(
    graphql`
      fragment ApprovalProposalDetailPanelCodeChangesFragment on ApprovalVotingProposalData {
        options {
          transactions {
            target {
              address
            }
            value
            calldata
            functionName
            functionArgs
          }
          description
        }
      }
    `,
    fragmentRef
  );

  const toggleElements = () => {
    displayedOptions === 1
      ? setDisplayedOptions(proposalData.options.length)
      : setDisplayedOptions(1);
  };

  // If there are no transactions attached to the calldata,
  // don't show the code changes section
  const hasNoTransactions = proposalData.options.every(
    (option: any) => option.transactions.length === 0
  );

  if (hasNoTransactions) {
    return null;
  }

  return (
    <VStack
      gap="1"
      className={css`
        border: 1px solid #e0e0e0;
        border-radius: ${theme.borderRadius.lg};
        padding: ${theme.spacing["4"]};
        background-color: ${theme.colors.gray["fa"]};
      `}
    >
      <p
        className={css`
          font-size: ${theme.fontSize.xs};
          font-family: ${theme.fontFamily.mono};
          font-weight: ${theme.fontWeight.medium};
          color: ${theme.colors.gray.af};
          line-height: ${theme.lineHeight["4"]};
          margin-bottom: ${theme.spacing[2]};
        `}
      >
        Proposed Transactions - only approved options will execute
      </p>
      <VStack>
        {proposalData.options
          .slice(0, displayedOptions)
          .map((option: any, index: any) => {
            return (
              <div key={index}>
                <p
                  className={css`
                    font-size: ${theme.fontSize.xs};
                    font-family: ${theme.fontFamily.mono};
                    font-weight: ${theme.fontWeight.medium};
                    color: ${theme.colors.gray.af};
                    line-height: ${theme.lineHeight["4"]};
                  `}
                >
                  {"//"} {option.description}
                </p>
                {option.transactions.map((transaction: any, idx: any) => (
                  <CodeChange
                    key={idx}
                    target={transaction.target.address}
                    calldata={transaction.calldata}
                    value={transaction.value}
                    functionName={transaction.functionName}
                    functionArgs={transaction.functionArgs}
                  />
                ))}
              </div>
            );
          })}
      </VStack>
      {proposalData.options.length > 1 && (
        <div
          className={css`
            cursor: pointer;
            font-size: ${theme.fontSize.xs};
            font-family: ${theme.fontFamily.mono};
            font-weight: ${theme.fontWeight.medium};
            color: ${theme.colors.gray.af};
            line-height: ${theme.lineHeight["4"]};
            padding-top: ${theme.spacing[4]};
            padding-left: ${theme.spacing[2]};
            border-top: 1px solid ${theme.colors.gray.eo};
          `}
          onClick={toggleElements}
        >
          {displayedOptions === 1
            ? `Reveal ${proposalData.options.length - 1} more options`
            : "Hide options"}
        </div>
      )}
    </VStack>
  );
}

export function CodeChange({
  target,
  calldata,
  value,
  functionName,
  functionArgs,
}: {
  target: string;
  calldata: string;
  value: string;
  functionName: string;
  functionArgs: string[];
}) {
  const valueBN = BigNumber.from(value);
  const valueAmount = valueBN.gt(0)
    ? `{ value: ${utils.formatEther(valueBN)} ETH }`
    : undefined;

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
        padding-left: ${theme.spacing[2]};
        border-left: 1px solid ${theme.colors.gray.eo};
      `}
    >
      {linkIfAddress(target)}.{functionName}
      {valueAmount}(
      <br />
      <span
        className={css`
          margin-left: ${theme.spacing[2]};
        `}
      >
        {functionArgs.length !== 0 ? (
          functionArgs.map((arg, index) => (
            <span key={index}>
              {arg}
              {index !== functionArgs.length - 1 && ", "}
            </span>
          ))
        ) : (
          <>
            {calldata !== "0x" && "0x"}
            {calldata
              .substring(2)
              .match(/.{1,64}/g)
              ?.map((data, index) => (
                <span
                  key={index}
                  className={css`
                    margin-left: ${index !== 0 && theme.spacing[6]};
                  `}
                >
                  {data}
                  <br />
                </span>
              ))}
          </>
        )}
      </span>
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
  if (description.startsWith(`# ${title}`)) {
    const newDescription = description.slice(`# ${title}`.length).trim();
    return newDescription;
  }
  return description;
}
