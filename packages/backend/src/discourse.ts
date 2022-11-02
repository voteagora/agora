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
        posts: z.array(
          z
            .object({
              id: z.number(),
            })
            .passthrough()
        ),
      })
      .passthrough(),
  })
  .passthrough();

export async function fetchThread(args: FetchThreadArgs) {
  const response = await fetch(
    new URL(`t/${args.threadId}.json`, args.baseUrl).toString()
  );

  const body = await response.json();
  return fetchThreadResponse.parse(body);
}

type FetchPostArgs = {
  postId: number;
} & BaseArgs;

const fetchPostResponse = z
  .object({
    raw: z.string(),
  })
  .passthrough();

export async function fetchPost(args: FetchPostArgs) {
  const response = await fetch(
    new URL(`posts/${args.postId}.json`, args.baseUrl)
  );

  const body = await response.json();
  return fetchPostResponse.parse(body);
}
