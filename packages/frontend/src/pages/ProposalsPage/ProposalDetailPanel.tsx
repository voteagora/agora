import { css } from "@emotion/css";
import { graphql, useFragment } from "react-relay";

import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { Markdown } from "../../components/Markdown";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { ProposalTransactionDisplay } from "../../components/ProposalTransactionDisplay";

const TOKEN_BUYER_CONTRACT_ADDRESS =
  "0x4f2aCdc74f6941390d9b1804faBc3E780388cfe5";
import { ProposalDetailPanelFragment$key } from "./__generated__/ProposalDetailPanelFragment.graphql";

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
          target {
            resolvedName {
              address
            }
          }
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

  const usdcRefilTransaction = proposal.transactions.find(
    (transaction) =>
      transaction.target.resolvedName.address === TOKEN_BUYER_CONTRACT_ADDRESS
  );

  const displayedTransactions = proposal.transactions.filter(
    (transaction) =>
      transaction.target.resolvedName.address !== TOKEN_BUYER_CONTRACT_ADDRESS
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
        <VStack
          gap="2"
          className={css`
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              margin-bottom: ${theme.spacing["48"]};
            }
          `}
        >
          <VStack
            gap="1"
            className={css`
              /* border: 1px solid #e0e0e0; */
              border-radius: ${theme.borderRadius.lg};
              background-color: #f7f7f7;
            `}
          >
            <VStack
              className={css`
                padding: ${theme.spacing["4"]} ${theme.spacing["4"]} 0
                  ${theme.spacing["4"]};
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
                {displayedTransactions.map((tx, idx) => (
                  <ProposalTransactionDisplay key={idx} fragment={tx} />
                ))}
              </VStack>
            </VStack>

            {usdcRefilTransaction && (
              <a
                href={`https://etherscan.io/address/${TOKEN_BUYER_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className={css`
                  font-size: ${theme.fontSize.xs};
                  font-weight: ${theme.fontWeight.medium};
                  color: ${theme.colors.gray.af};
                  border-top: 1px solid ${theme.colors.gray.eb};
                  padding: ${theme.spacing["4"]};
                `}
              >
                Includes an additional hidden transaction to refill the USDC
                TokenBuyer, which the proposer does not receive.
              </a>
            )}
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
