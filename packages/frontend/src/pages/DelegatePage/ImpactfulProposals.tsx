import { useFragment, graphql } from "react-relay";
import { css } from "@emotion/css";

import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { ProposalLink } from "../../components/ProposalLink";

import { ImpactfulProposalsFragment$key } from "./__generated__/ImpactfulProposalsFragment.graphql";
import { ImpactfulProposalsProposalFragment$key } from "./__generated__/ImpactfulProposalsProposalFragment.graphql";
import { ValuePart } from "./VoteDetailsContainer";

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

  if (
    !impactfulProposals.mostValuableProposals.length &&
    !impactfulProposals.leastValuableProposals.length
  ) {
    return null;
  }

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

      <HStack
        gap="4"
        className={css`
          @media (max-width: ${theme.maxWidth.xl}) {
            flex-direction: column;
          }
        `}
      >
        {!!impactfulProposals.mostValuableProposals.length && (
          <VStack
            className={css`
              flex: 1;
            `}
          >
            <h1
              className={css`
                font-weight: ${theme.fontWeight.medium};
                font-size: ${theme.fontSize.sm};
                margin-bottom: ${theme.spacing[2]};
              `}
            >
              Most Impactful
            </h1>

            <VStack
              className={css`
                border: 1px solid ${theme.colors.gray.eb};
                box-shadow: ${theme.boxShadow.newDefault};
                border-radius: ${theme.spacing["2"]};
                background: ${theme.colors.white};
              `}
            >
              {impactfulProposals.mostValuableProposals.map((proposal) => (
                <Proposal key={proposal.id} fragment={proposal} />
              ))}
            </VStack>
          </VStack>
        )}

        {!!impactfulProposals.leastValuableProposals.length && (
          <VStack
            className={css`
              flex: 1;
            `}
          >
            <h1
              className={css`
                font-weight: ${theme.fontWeight.medium};
                font-size: ${theme.fontSize.sm};
                margin-bottom: ${theme.spacing[2]};
              `}
            >
              Least Impactful
            </h1>
            <VStack
              className={css`
                background: ${theme.colors.white};
                border: 1px solid ${theme.colors.gray.eb};
                box-shadow: ${theme.boxShadow.newDefault};
                border-radius: ${theme.spacing["2"]};
              `}
            >
              {impactfulProposals.leastValuableProposals.map((proposal) => (
                <Proposal key={proposal.id} fragment={proposal} />
              ))}
            </VStack>
          </VStack>
        )}
      </HStack>
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
        number
        title
        ethValue
        usdcValue

        ...ProposalLinkFragment
      }
    `,
    fragment
  );

  return (
    <ProposalLink fragmentRef={proposal}>
      <VStack
        justifyContent="center"
        className={css`
          padding: ${theme.spacing["0"]} ${theme.spacing["5"]};
          height: ${theme.spacing["20"]};
          border-bottom: 1px solid ${theme.colors.gray.eb};
        `}
      >
        <div
          className={css`
            font-size: ${theme.fontSize.xs};
            font-weight: ${theme.fontWeight.medium};
            color: #66676b;
          `}
        >
          {"Prop " + proposal.number}{" "}
          <ValuePart
            ethValue={proposal.ethValue}
            usdcValue={proposal.usdcValue}
          />
        </div>
        {proposal.title}
      </VStack>
    </ProposalLink>
  );
}
