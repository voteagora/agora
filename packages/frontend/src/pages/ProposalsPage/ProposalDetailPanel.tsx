import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VStack } from "../../components/VStack";
import { Markdown } from "../../components/Markdown";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { ProposalDetailPanelFragment$key } from "./__generated__/ProposalDetailPanelFragment.graphql";
import { ProposalDetailPanelCodeChangesFragment$key } from "./__generated__/ProposalDetailPanelCodeChangesFragment.graphql";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { CodeChange } from "./ApprovalProposal/ApprovalProposalDetailPanel";

export const ProposalDetailPanelFragment = graphql`
  fragment ProposalDetailPanelFragment on Proposal {
    title
    number
    description
    proposer {
      address {
        resolvedName {
          ...NounResolvedLinkFragment
          address
        }
      }
    }
  }
`;

export function ProposalDetailPanel({
  fragmentRef,
  codeChangesFragment,
}: {
  fragmentRef: ProposalDetailPanelFragment$key;
  codeChangesFragment: ProposalDetailPanelCodeChangesFragment$key;
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
          <CodeChanges fragmentRef={codeChangesFragment} />
          <Markdown
            markdown={stripTitleFromDescription(title, patchedDescription)}
          />
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
  const proposalData = useFragment(
    graphql`
      fragment ProposalDetailPanelCodeChangesFragment on StandardProposalData {
        transactions {
          target {
            address
          }
          calldata
          value
          functionName
          functionArgs
        }
      }
    `,
    fragmentRef
  );

  // If there are no transactions attached to the calldata,
  // don't show the code changes section
  const hasNoTransactions = proposalData.transactions?.length === 0;

  if (hasNoTransactions) {
    return null;
  }

  return (
    <VStack
      gap="1"
      className={css`
        /* border: 1px solid #e0e0e0; */
        border: 1px solid #e0e0e0;
        border-radius: ${theme.borderRadius.lg};
        background-color: ${theme.colors.gray["fa"]};
        padding: ${theme.spacing["4"]};
      `}
    >
      <p
        className={css`
          font-size: ${theme.fontSize.xs};
          font-family: ${theme.fontFamily.mono};
          font-weight: ${theme.fontWeight.medium};
          color: ${theme.colors.gray.af};
          line-height: ${theme.lineHeight["4"]};
        `}
      >
        Proposed Transactions
      </p>
      <VStack>
        {proposalData.transactions &&
          proposalData.transactions.map((transaction: any, idx: any) => {
            return (
              <CodeChange
                key={idx}
                target={transaction.target.address}
                calldata={transaction.calldata}
                value={transaction.value}
                functionName={transaction.functionName}
                functionArgs={transaction.functionArgs}
              />
            );
          })}
      </VStack>
    </VStack>
  );
}

function stripTitleFromDescription(title: string, description: string) {
  // TODO: This is very fragile. Consider using a regex instead?
  if (description.startsWith(`# ${title}\n`)) {
    const newDescription = description.slice(`# ${title}\n`.length).trim();
    return newDescription;
  }
  return description;
}
