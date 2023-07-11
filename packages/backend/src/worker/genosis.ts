import {
  fetchWithTracer,
  headerKeys,
} from "../shared/workers/datadogTracer/fetch";
import { DatadogTracer } from "../shared/workers/datadogTracer/tracer";

import { makeTracingOptions } from "./datadog";
import { Env } from "./env";

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
  env,
}: {
  safeMessageHash: string;
  env: Env;
}) {
  try {
    const url = new URL(
      `https://safe-transaction-mainnet.safe.global/api/v1/messages/${safeMessageHash}`
    );
    const tracer = new DatadogTracer(
      makeTracingOptions(env, "safe-transaction-mainnet.safe.global")
    );
    const request = new Request(url.toString(), {
      headers: { "Content-Type": "application/json" },
    });
    const span = tracer.startSpan({
      name: "fetch",
      resource: url.pathname,
      meta: {
        "http.method": "GET",
        "http.url": url.toString(),
        ...headerKeys("request", request.headers),
      },
    });

    const response = await fetchWithTracer(span, request);
    return { response: await response.json() };
  } catch (error) {
    return {
      error,
    };
  }
}
