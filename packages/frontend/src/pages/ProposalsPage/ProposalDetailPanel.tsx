import { css } from "@emotion/css";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { Markdown } from "../../components/Markdown";
import graphql from "babel-plugin-relay/macro";
import { useFragment } from "react-relay";
import { ProposalDetailPanelFragment$key } from "./__generated__/ProposalDetailPanelFragment.graphql";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { ProposalTransactionDisplay } from "../../components/ProposalTransactionDisplay";

export function ProposalDetailPanel({
  fragmentRef,
}: {
  fragmentRef: ProposalDetailPanelFragment$key;
}) {
  const proposal = useFragment(
    graphql`
      fragment ProposalDetailPanelFragment on Proposal {
        title
        description
        transactions {
          ...ProposalTransactionDisplayFragment
        }

        proposer {
          address {
            resolvedName {
              ...NounResolvedLinkFragment
              address
            }
          }
        }
      }
    `,
    fragmentRef
  );

  return (
    <>
      <VStack gap="4">
        <HStack
          justifyContent="space-between"
          alignItems="center"
          className={css`
            @media (max-width: ${theme.maxWidth["2xl"]}) {
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
            {proposal.title}
          </h2>
          <div
            className={css`
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.semibold};
              color: ${theme.colors.gray[700]};
            `}
          >
            by&nbsp;
            <NounResolvedLink
              resolvedName={proposal.proposer.address.resolvedName}
            />
          </div>
        </HStack>
        <VStack gap="2" className={css`
        @media (max-width: ${theme.maxWidth["2xl"]}) {
          margin-bottom: ${theme.spacing["48"]};
        }
        `}>
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
              {proposal.transactions.map((tx, idx) => (
                <ProposalTransactionDisplay key={idx} fragment={tx} />
              ))}
            </VStack>
          </VStack>
          <Markdown
            markdown={stripTitleFromDescription(
              proposal.title,
              proposal.description
            )}
          />
        </VStack>
      </VStack>
    </>
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
