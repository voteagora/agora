import { useFragment } from "react-relay";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import graphql from "babel-plugin-relay/macro";
import { HStack, VStack } from "../../components/VStack";
import { ImpactfulProposalsFragment$key } from "./__generated__/ImpactfulProposalsFragment.graphql";
import { ImpactfulProposalsProposalFragment$key } from "./__generated__/ImpactfulProposalsProposalFragment.graphql";
import { ValuePart } from "./VoteDetails";

export type Props = {
  fragment: ImpactfulProposalsFragment$key;
};

export function ImpactfulProposals({ fragment }: Props) {
  const impactfulProposals = useFragment(
    graphql`
      fragment ImpactfulProposalsFragment on DelegateStatement {
        mostValuableProposals {
          id
          ...ImpactfulProposalsProposalFragment
        }

        leastValuableProposals {
          id
          ...ImpactfulProposalsProposalFragment
        }
      }
    `,
    fragment
  );

  return (
    <VStack gap="4">
      <h2
        className={css`
          font-size: ${theme.fontSize["2xl"]};
          font-weight: bold;
        `}
      >
        Views on past issues
      </h2>
      <div
        className={css`
          border-radius: ${theme.spacing["3"]};
          border: 1px solid ${theme.colors.gray.eb};
          box-shadow: ${theme.boxShadow.newDefault};
          padding: ${theme.spacing["4"]};
          background-color: ${theme.colors.white};
        `}
      >
        <HStack>
          <VStack>
            <h1
              className={css`
                font-weight: ${theme.fontWeight.medium};
                font-size: ${theme.fontSize.sm};
                margin-bottom: ${theme.spacing[2]};
              `}
            >
              Most Impactful
            </h1>
            <div
              className={css`
                border: 1px solid ${theme.colors.gray.eb};
                box-shadow: ${theme.boxShadow.newDefault};
                border-radius: ${theme.spacing["2"]} 0 0 ${theme.spacing["2"]};
              `}
            >
              <VStack>
                {impactfulProposals.mostValuableProposals.map((proposal) => (
                  <Proposal key={proposal.id} fragment={proposal} />
                ))}
              </VStack>
            </div>
          </VStack>

          <VStack>
            <h1
              className={css`
                font-weight: ${theme.fontWeight.medium};
                font-size: ${theme.fontSize.sm};
                margin-bottom: ${theme.spacing[2]};
              `}
            >
              Least Impactful
            </h1>
            <div
              className={css`
                border: 1px solid ${theme.colors.gray.eb};
                box-shadow: ${theme.boxShadow.newDefault};
                position: relative;
                left: -1px;
                border-radius: 0 ${theme.spacing["2"]} ${theme.spacing["2"]} 0;
              `}
            >
              <VStack>
                {impactfulProposals.leastValuableProposals.map((proposal) => (
                  <Proposal key={proposal.id} fragment={proposal} />
                ))}
              </VStack>
            </div>
          </VStack>
        </HStack>
      </div>
    </VStack>
  );
}

type ProposalProps = {
  fragment: ImpactfulProposalsProposalFragment$key;
};

function Proposal({ fragment }: ProposalProps) {
  const proposal = useFragment(
    graphql`
      fragment ImpactfulProposalsProposalFragment on Proposal {
        id
        title
        totalValue
      }
    `,
    fragment
  );

  return (
    <VStack
      justifyContent="center"
      className={css`
        padding: ${theme.spacing["0"]} ${theme.spacing["5"]};
        height: ${theme.spacing["20"]};
        border-bottom: 1px solid ${theme.colors.gray.eb};
      `}
    >
      {proposal.title} <ValuePart value={proposal.totalValue} />
    </VStack>
  );
}
