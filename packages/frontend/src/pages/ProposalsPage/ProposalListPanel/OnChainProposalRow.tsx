import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { ProposalRow } from "./ProposalRow";
import { utils } from "ethers";
import { colorForOnChainProposalStatus } from "../../ProposalsListPage/OnChainProposalRow";
import { OnChainProposalRowListFragment$key } from "./__generated__/OnChainProposalRowListFragment.graphql";

export function OnChainProposalRow({
  fragmentRef,
  selected,
  onClick,
}: {
  fragmentRef: OnChainProposalRowListFragment$key;
  selected: boolean;
  onClick: () => void;
}) {
  const proposal = useFragment(
    graphql`
      fragment OnChainProposalRowListFragment on Proposal {
        number
        status
        title
        totalValue
        proposer {
          address {
            resolvedName {
              # eslint-disable-next-line relay/must-colocate-fragment-spreads
              ...NounResolvedLinkFragment
            }
          }
        }
      }
    `,
    fragmentRef
  );

  return (
    <ProposalRow
      proposerResolvedName={proposal.proposer.address.resolvedName}
      onClick={onClick}
      selected={selected}
      typeTitle={`Prop ${proposal.number} for ${utils.formatEther(
        proposal.totalValue
      )} ETH`}
      status={proposal.status}
      statusColor={colorForOnChainProposalStatus(proposal.status)}
      title={proposal.title}
    />
  );
}
