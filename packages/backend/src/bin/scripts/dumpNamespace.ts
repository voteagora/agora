import fetch, { Request } from "node-fetch";
import { promises as fs } from "fs";

type FetchKeysParams = {
  limit?: string;
  cursor?: string;
  prefix?: string;
};

async function fetchKeys(
  accountId: string,
  namespaceId: string,
  params: FetchKeysParams
) {
  const response = await fetch(
    buildRequest(
      `v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys`,
      params
    )
  );

  return (await response.json()) as ListEnvelope<Key[]>;
}

function buildRequest(path: string, params: Record<string, string>) {
  const request = new Request(buildUrl(path, params), {
    headers: {
      Authorization: `Bearer ${process.env.CF_AUTH_KEY}`,
    },
  });

  return request;
}

type ListEnvelope<T> = {
  success: boolean;
  errors: any[];
  messages: any[];
  result: T;
  result_info: ResultInfo;
};

type Key = {
  name: string;
  expiration?: number;
  metadata?: Record<string, string>;
};

type ResultInfo = {
  count: number;
  cursor: string;
};

async function fetchValue(
  accountId: string,
  namespaceId: string,
  name: string
) {
  const response = await fetch(
    buildRequest(
      `v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${name}`,
      {}
    )
  );

  return response.text();
}

function buildUrl(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return `https://api.cloudflare.com/client/${path}?${searchParams.toString()}`;
}

async function* fetchAllKeys(
  accountId: string,
  namespaceId: string,
  prefix: string = ""
) {
  let page = await fetchKeys(accountId, namespaceId, { prefix });
  yield* page.result;

  // todo: ending condition
  while (page.result_info.cursor) {
    page = await fetchKeys(accountId, namespaceId, {
      prefix,
      cursor: page.result_info.cursor,
    });
    yield* page.result;
  }
}

export async function main() {
  const accountId = "86fdf8ef811b4d0aa8954fa036684ea3";
  const namespaceId = "dc57f476cdbd4728962dd2b6bf679f32";

  const fileHandle = await fs.open(`${namespaceId}.jsonl`, "a");

  for await (const key of fetchAllKeys(accountId, namespaceId)) {
    const value = await fetchValue(accountId, namespaceId, key.name);
    const retrievedAt = Date.now();

    const serializedValue = JSON.stringify({
      value,
      retrievedAt,
      key,
    });

    await fileHandle.appendFile(serializedValue + "\n");
  }

  await fileHandle.close();
}

main();
