import { add, formatRFC7231 } from "date-fns";

import { Context } from "./context";

export async function fetchThroughCache(
  cache: Cache,
  request: Request,
  computeCacheValue: () => Promise<Response>,
  ctx: Context,
  seconds: number
): Promise<Response> {
  const requestKeySuffix = await hashSHA256(await request.text());
  const requestKey = `https://example.com/${requestKeySuffix}`;

  const cachedResponse = await cache.match(requestKey);
  if (cachedResponse) {
    return new Response(cachedResponse.body);
  }

  const response = await computeCacheValue();
  if (response.ok && response.body) {
    const cacheResponse = response.clone();

    ctx.waitUntil(
      cache.put(
        requestKey,
        new Response(cacheResponse.body, {
          headers: {
            expires: formatRFC7231(add(new Date(), { seconds })),
          },
        })
      )
    );
  }

  return response;
}

async function hashSHA256(text: string): Promise<string> {
  const inputUint8Array = new TextEncoder().encode(text);

  const arrayBuf = await crypto.subtle.digest(
    { name: "SHA-256" },
    inputUint8Array
  );
  const outputUint8Array = new Uint8Array(arrayBuf);

  let hash = "";
  for (let i = 0, l = outputUint8Array.length; i < l; i++) {
    const hex = outputUint8Array[i].toString(16);
    hash += "00".slice(0, Math.max(0, 2 - hex.length)) + hex;
  }

  return hash;
}
