import { css } from "@emotion/css";
import { graphql, useFragment } from "react-relay";
import { ethers } from "ethers";
import { useEnsAvatar } from "wagmi";

import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { Markdown } from "../../components/Markdown";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { ProposalTransactionDisplay } from "../../components/ProposalTransactionDisplay";
import { icons } from "../../icons/icons";

import {
  ProposalDetailPanelFragment$data,
  ProposalDetailPanelFragment$key,
} from "./__generated__/ProposalDetailPanelFragment.graphql";

export function ProposalDetailPanel({
  fragmentRef,
}: {
  fragmentRef: ProposalDetailPanelFragment$key;
}) {
  const proposal = useFragment(
    graphql`
      fragment ProposalDetailPanelFragment on OnChainProposal {
        title
        description
        # eslint-disable-next-line relay/unused-fields
        transactions {
          signature
          calldata
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
  const avatar = useEnsAvatar({
    address: proposal.proposer.address.resolvedName.address as any,
  });

  return (
    <>
      <VStack
        gap="4"
        className={css`
          width: 100%;
        `}
      >
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
          <HStack gap="2" alignItems="center">
            <img
              className={css`
                width: 24px;
                height: 24px;
                border-radius: ${theme.borderRadius.md};
              `}
              src={avatar.data || icons.anonNoun}
              alt={"anon noun"}
            />
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
        </HStack>
        <VStack
          gap="2"
          className={css`
            margin-bottom: ${theme.spacing["16"]};
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              margin-bottom: ${theme.spacing["48"]};
            }
          `}
        >
          <VStack
            gap="1"
            className={css`
              border: 1px solid #e0e0e0;
              border-radius: ${theme.borderRadius.lg};
              background-color: ${theme.colors.gray["fa"]};
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
                  font-family: ${theme.fontFamily.mono};
                  font-weight: ${theme.fontWeight.medium};
                  color: ${theme.colors.gray.af};
                  line-height: ${theme.lineHeight["4"]};
                  margin-bottom: ${theme.spacing[2]};
                `}
              >
                Proposed Transactions
              </div>
              <VStack>
                {proposal.transactions.map((tx, idx) => (
                  <ProposalTransactionDisplay
                    key={idx}
                    fragment={tx}
                    transactions={proposal.transactions}
                  />
                ))}
              </VStack>
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
