type TransactionServiceSafeMessage = {
  messageHash: string;
  status: string;
  logoUri: string | null;
  name: string | null;
  message: string; //| EIP712TypedData,
  creationTimestamp: number;
  modifiedTimestamp: number;
  confirmationsSubmitted: number;
  confirmationsRequired: number;
  proposedBy: { value: string };
  confirmations: [
    {
      owner: { value: string };
      signature: string;
    }
  ];
  preparedSignature: string | null;
};

export async function fetchMessage({
  safeMessageHash,
}: {
  safeMessageHash: string;
}) {
  try {
    const response = await fetch(
      `https://safe-transaction-optimism.safe.global/api/v1/messages/${safeMessageHash}`,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return { response: await response.json() };
  } catch (error) {
    return {
      error,
    };
  }
}
