import { z } from "zod";

type BaseArgs = {
  baseUrl: string;
};

type FetchThreadArgs = {
  threadId: number;
} & BaseArgs;

const fetchThreadResponse = z
  .object({
    post_stream: z
      .object({
        stream: z.array(z.number()),
      })
      .passthrough(),
  })
  .passthrough();

export async function fetchThread(args: FetchThreadArgs) {
  return parseJson(
    await fetch(new URL(`t/${args.threadId}.json`, args.baseUrl).toString()),
    fetchThreadResponse
  );
}

type FetchPostArgs = {
  postId: number;
} & BaseArgs;

export const fetchPostResponse = z
  .object({
    raw: z.string(),
    post_number: z.number(),
  })
  .passthrough();

export async function fetchPost(args: FetchPostArgs) {
  return parseJson(
    await fetch(new URL(`posts/${args.postId}.json`, args.baseUrl)),
    fetchPostResponse
  );
}

async function parseJson<T extends z.ZodType<any, any, any>>(
  response: Response,
  schema: T
): Promise<z.infer<T>> {
  const text = await response.text();

  const parsed = (() => {
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`failed to parse: ${e} ${text}`);
    }
  })();

  return schema.parse(parsed);
}
