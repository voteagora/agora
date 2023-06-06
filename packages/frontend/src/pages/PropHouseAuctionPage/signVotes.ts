import { ethers, TypedDataField } from "ethers";
import { TypedDataSigner } from "@ethersproject/abstract-signer";
import { Alligator__factory } from "@agora/common/src/contracts/generated";

import { contracts } from "../../utils/contracts";

import { COMMUNITY_ADDRESS } from "./PropHouseAuctionPage";

type AddressVoteAssignment = {
  address: string;

  votes: {
    weight: number;
    proposalNumber: number;
  }[];
};

const DomainSeparator = {
  name: "Prop House",
};

const VoteMessageTypes: Record<string, TypedDataField[]> = {
  Votes: [{ name: "votes", type: "Vote[]" }],
  Vote: [
    { name: "direction", type: "uint256" },
    { name: "proposalId", type: "uint256" },
    { name: "weight", type: "uint256" },
    { name: "communityAddress", type: "address" },
    { name: "blockHeight", type: "uint256" },
  ],
};

export async function* signTokenDelegationVotes(
  assignment: AddressVoteAssignment,
  blockNumber: number,
  typedSigner: ethers.Signer & TypedDataSigner
) {
  const payload = makePayload(assignment.votes, blockNumber);

  const shared = {
    signedData: {
      message: serializePayload(payload),
      signature: await typedSigner._signTypedData(
        DomainSeparator,
        VoteMessageTypes,
        payload
      ),
      signer: assignment.address,
    },
    address: assignment.address,
    messageTypes: VoteMessageTypes,
    domainSeparator: DomainSeparator,
  };

  for (const vote of payload.votes) {
    yield {
      ...shared,
      ...vote,
    };
  }
}

export async function* signLiquidDelegatedVotes(
  assignment: AddressVoteAssignment,
  blockNumber: number,
  authorityChain: string[],
  typedSigner: ethers.Signer & TypedDataSigner
) {
  const payload = makePayload(assignment.votes, blockNumber);
  const serializedPayload = serializePayload(payload);

  const alligator = Alligator__factory.connect(
    // TODO: FIX
    contracts.nounsAlligator.address,
    typedSigner
  );
  const transaction = await alligator.sign(
    authorityChain,
    ethers.utils.hashMessage(serializedPayload)
  );
  await transaction.wait();

  const shared = {
    signedData: {
      message: serializedPayload,
      signature: "0x",
      signer: assignment.address,
    },
    address: assignment.address,
  };

  for (const vote of payload.votes) {
    yield {
      ...shared,
      ...vote,
    };
  }
}

function serializePayload(payload: ReturnType<typeof makePayload>) {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function makePayload(
  votes: AddressVoteAssignment["votes"],
  blockNumber: number
) {
  return {
    votes: votes.map(({ weight, proposalNumber }) => {
      return {
        direction: 1,
        proposalId: proposalNumber,
        weight,
        communityAddress: COMMUNITY_ADDRESS,
        blockHeight: blockNumber,
      };
    }),
  };
}
