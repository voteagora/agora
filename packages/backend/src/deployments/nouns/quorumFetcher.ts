import { ethers } from "ethers";
import { NounsDAOLogicV2__factory } from "@agora/common/src/contracts/generated";

import { LatestBlockFetcher } from "../../shared/schema/context/latestBlockFetcher";
import { loadAggregate } from "../../shared/contracts/indexers/IVotes/entities/aggregate";

import { daoContract, daoContractSepolia } from "./indexers/NounsDAO/NounsDAO";
import { Context } from "./application";

export async function fetchQuorumForProposal(
  proposalId: bigint,
  provider: ethers.providers.BaseProvider
) {
  const nounsDaoContract = NounsDAOLogicV2__factory.connect(
    (await provider.getNetwork()).chainId == 1
      ? daoContract.address
      : daoContractSepolia.address,
    provider
  );

  return (await nounsDaoContract.quorumVotes(proposalId)).toBigInt();
}

export async function fetchLatestQuorum(
  provider: ethers.providers.BaseProvider,
  latestBlockFetcher: LatestBlockFetcher,
  reader: Context["reader"]
) {
  const nounsDaoContract = NounsDAOLogicV2__factory.connect(
    (await provider.getNetwork()).chainId == 1
      ? daoContract.address
      : daoContractSepolia.address,
    provider
  );

  const latestBlock = await latestBlockFetcher.getLatestBlock();
  const quorumParams = await nounsDaoContract.getDynamicQuorumParamsAt(
    latestBlock.number
  );
  const agg = await loadAggregate(reader);

  return (
    await nounsDaoContract.dynamicQuorumVotes(0, agg.totalSupply, quorumParams)
  ).toBigInt();
}
