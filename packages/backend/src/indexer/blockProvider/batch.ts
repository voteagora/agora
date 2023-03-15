import { ethers } from "ethers";

export async function fetchBatch(
  connection: ethers.providers.JsonRpcProvider["connection"],
  args: JsonRpcBatchMessageArgument[]
) {
  const response = await fetch(connection.url, {
    method: "POST",
    body: JSON.stringify(
      args.map((it, idx) => makeJsonRpcMessage(it.method, it.params, idx))
    ),
    headers: new Headers([
      ...Object.entries(connection.headers ?? {}).map(
        ([key, value]): [string, string] => [key, value.toString()]
      ),
      ["content-type", "application/json"],
    ]),
  });

  return response.json<JsonBatchMessageResponseItem[]>();
}

type JsonBatchMessageResponseItem = {
  jsonrpc: "2.0";
  id: number;
} & (
  | {
      error: {
        code: number;
        message: string;
      };
    }
  | {
      result: any;
    }
);

type JsonRpcBatchMessageArgument = {
  method: string;
  params: any[];
};

function makeJsonRpcMessage(method: string, params: any[], id: number) {
  return {
    jsonrpc: "2.0",
    method,
    params,
    id,
  };
}
