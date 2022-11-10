import { isFuture, addDays } from "date-fns";
import { ethers } from "ethers";
import z from "zod";

function narrowSigner(
  signer: ethers.Signer
): signer is ethers.Signer & Pick<ethers.Wallet, "_signTypedData"> {
  return "_signTypedData" in signer;
}

export async function delegateUsingRelay(
  provider: ethers.providers.Provider,
  signer: ethers.Signer,
  delegatee: string
) {
  if (!narrowSigner(signer)) {
    return;
  }

  const address = await signer.getAddress();

  const { next, nonce } = await query(address);
  if (isFuture(next)) {
    // todo: in this case delegate by other way
    return;
  }

  const params: DelegateBySigParams = {
    delegatee,
    nonce,
    expiry: Math.floor(addDays(Date.now(), 7).valueOf() / 1000),
  };

  const signedPayload = await signer._signTypedData(
    {
      name: "Ethereum Name Service",
      version: "1",
      chainId: 1,
      // todo: share contract address configuration
      verifyingContract: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
    },
    {
      Delegation: [
        { name: "delegatee", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "expiry", type: "uint256" },
      ],
    },
    params
  );

  const signature = ethers.utils.splitSignature(signedPayload);

  return { message: (await delegate(params, signature)).message };
}

const queryResponseShape = z.object({
  next: z.number(),
  nonce: z.number(),
});

export async function query(address: string) {
  const response = queryResponseShape.parse(
    await sendRequest("query", { address })
  );

  return {
    /// Time at which signing became available or will become available.
    next: new Date(response.next * 1000),
    nonce: response.nonce,
  };
}

const delegateResponseShape = z.object({
  // Transaction hash of the pending transaction.
  message: z.string(),
});

type DelegateBySigParams = {
  delegatee: string;
  nonce: number;
  expiry: number;
};

export async function delegate(
  params: DelegateBySigParams,
  signature: ethers.Signature
) {
  const response = await sendRequest("delegate", {
    ...params,
    r: signature.r,
    s: signature.s,
    v: signature.v,
  });

  return delegateResponseShape.parse(response);
}

const ensDelegateRelayEndpoint =
  "https://us-central1-ens-delegator.cloudfunctions.net/delegate";

async function sendRequest(method: string, params: Record<string, any>) {
  const response = await fetch(ensDelegateRelayEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    }),
  });

  const body = await response.json();
  if (body.error) {
    throw new ENSRelayRpcError(body.error.message);
  }

  return body.result;
}

class ENSRelayRpcError extends Error {}
