import { useFragment, graphql } from "react-relay";
import { utils } from "ethers";

import { colorForOnChainProposalStatus } from "../../ProposalsListPage/OnChainProposalRow";

import { ProposalRow } from "./ProposalRow";
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
        ethValue
        usdcValue
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

  const titleAmount = () => {
    if (proposal.usdcValue !== "0" && proposal.ethValue !== "0") {
      return `${parseFloat(
        utils.formatUnits(proposal.usdcValue, 6)
      ).toLocaleString("en-US")} USDC + ${parseFloat(
        utils.formatEther(proposal.ethValue)
      ).toFixed(1)} ETH`;
    } else if (proposal.usdcValue !== "0") {
      return `${parseFloat(
        utils.formatUnits(proposal.usdcValue, 6)
      ).toLocaleString("en-US")} USDC`;
    } else {
      return `${parseFloat(utils.formatEther(proposal.ethValue)).toFixed(
        1
      )} ETH`;
    }
  };

  return (
    <ProposalRow
      proposerResolvedName={proposal.proposer.address.resolvedName}
      onClick={onClick}
      selected={selected}
      typeTitle={`Prop ${proposal.number} for ${titleAmount()}`}
      status={proposal.status}
      statusColor={colorForOnChainProposalStatus(proposal.status)}
      title={proposal.title}
    />
  );
}
