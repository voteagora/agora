import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { HStack, VStack } from "../../components/VStack";
import { ImpactfulProposalsFragment$key } from "./__generated__/ImpactfulProposalsFragment.graphql";
import { ImpactfulProposalsProposalFragment$key } from "./__generated__/ImpactfulProposalsProposalFragment.graphql";

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
    <HStack>
      <VStack>
        <h1>Most Impactful</h1>

        <VStack>
          {impactfulProposals.mostValuableProposals.map((proposal) => (
            <Proposal key={proposal.id} fragment={proposal} />
          ))}
        </VStack>
      </VStack>

      <VStack>
        <h1>Least Impactful</h1>

        <VStack>
          {impactfulProposals.leastValuableProposals.map((proposal) => (
            <Proposal key={proposal.id} fragment={proposal} />
          ))}
        </VStack>
      </VStack>
    </HStack>
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
      }
    `,
    fragment
  );

  return <div>{proposal.title}</div>;
}
