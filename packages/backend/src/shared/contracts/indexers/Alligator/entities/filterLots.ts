import { ethers } from "ethers";
import { Address } from "viem";

import { EntityRuntimeType } from "../../../../indexer/process/process";
import { IGovernorProposal } from "../../IGovernor/entities/proposal";
import { LatestBlockFetcher } from "../../../../schema/context/latestBlockFetcher";
import { IRule__factory } from "../../../generated";
import { ReaderEntities } from "../../../../indexer/storage/reader/type";

import { ResolvedRules } from "./resolvedRules";
import { PERMISSION_PROPOSE, PERMISSION_SIGN, PERMISSION_VOTE } from "./rules";
import { ResolvedLiquidDelegatedVotesLot } from "./lots";

export type LotFilter = {
  canSign?: boolean | null;
  canVote?: boolean | null;
  canPropose?: boolean | null;

  currentlyActive?: boolean | null;

  forProposal?: {
    proposalId: string;
    support?: "FOR" | "AGAINST" | "ABSTAIN" | null;
  } | null;
};

export async function filterForProposal(
  filter: Pick<LotFilter, "forProposal">,
  lot: ResolvedLiquidDelegatedVotesLot,
  daoContract: Address,
  voterAddress: Address,
  provider: ethers.providers.BaseProvider,
  latestBlockFetcher: LatestBlockFetcher,
  reader: ReaderEntities<{ IGovernorProposal: typeof IGovernorProposal }>
): Promise<boolean> {
  if (filter.forProposal) {
    const proposal = await reader.getEntity(
      "IGovernorProposal",
      filter.forProposal.proposalId.toString()
    );
    if (!proposal) {
      throw new Error("invalid proposal id");
    }

    const latestBlock = await latestBlockFetcher.getLatestBlock();

    if (
      !(await checkBlocksBeforeVoteCloses(
        lot.rules,
        proposal,
        latestBlock.number
      ))
    ) {
      return false;
    }

    if (filter.forProposal.support) {
      for (const customRule of lot.rules.customRules) {
        const isValid = await checkCustomRule(
          customRule,
          daoContract,
          voterAddress,
          proposal.proposalId,
          filter.forProposal.support,
          provider
        );

        if (!isValid) {
          return false;
        }
      }
    }
  }

  return true;
}

export function filterPermissions(
  filter: Pick<LotFilter, "canVote" | "canSign" | "canPropose">,
  lot: ResolvedLiquidDelegatedVotesLot
) {
  if (lot.rules.permissions === 0) {
    return;
  }

  if (filter.canSign && !(lot.rules.permissions & PERMISSION_SIGN)) {
    return false;
  }

  if (filter.canVote && !(lot.rules.permissions & PERMISSION_VOTE)) {
    return false;
  }

  if (filter.canPropose && !(lot.rules.permissions & PERMISSION_PROPOSE)) {
    return false;
  }

  return true;
}

export function filterCurrentlyActive(
  filter: Pick<LotFilter, "currentlyActive">,
  lot: ResolvedLiquidDelegatedVotesLot,
  now: Date
) {
  if (!filter.currentlyActive) {
    return true;
  }

  return checkTimePermission(lot.rules, now);
}

async function checkCustomRule(
  daoContract: string,
  customRule: string,
  voter: string,
  proposalId: bigint,
  support: "FOR" | "AGAINST" | "ABSTAIN",
  provider: ethers.providers.Provider
) {
  const iface = IRule__factory.createInterface();
  const validateSighash = iface.getSighash(
    iface.functions["validate(address,address,uint256,uint8)"]
  );

  const irule = IRule__factory.connect(customRule, provider);

  const possibleSelector = await irule.validate(
    daoContract,
    voter,
    ethers.BigNumber.from(proposalId),
    support
  );

  return possibleSelector == validateSighash;
}

export async function checkBlocksBeforeVoteCloses(
  resolvedRule: ResolvedRules,
  proposal: EntityRuntimeType<typeof IGovernorProposal>,
  blockNumber: number
) {
  if (!resolvedRule.blocksBeforeVoteCloses) {
    return true;
  }

  return proposal.endBlock <= blockNumber + resolvedRule.blocksBeforeVoteCloses;
}

function checkTimePermission(resolvedRules: ResolvedRules, time: Date) {
  if (resolvedRules.notValidBefore && time < resolvedRules.notValidBefore) {
    return false;
  }

  if (resolvedRules.notValidAfter && time > resolvedRules.notValidAfter) {
    return false;
  }

  return true;
}
