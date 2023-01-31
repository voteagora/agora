import { z } from "zod";

export async function fetchOptimismDelegates() {
  const params = new URLSearchParams([
    ["batch", "1"],
    [
      "input",
      JSON.stringify({
        "0": {
          json: {
            sortBy: "weighted",
          },
        },
      }),
    ],
  ]);

  const response = await fetch(
    `https://claims-service-mainnet.optimism.io/api/v0/delegates?${params.toString()}`
  );

  const rawBody = (await response.json()) as unknown;
  const body = delegatesResponseType.parse(rawBody);

  return body[0].result.data.json;
}

const delegateType = z.object({
  address: z.string(),
  description: z.string(),
  languages: z.array(z.string()),
  interests: z.array(z.string()),
});

export const delegatesType = z.array(delegateType);

const delegatesResponseType = z.tuple([
  z.object({
    result: z.object({
      data: z.object({
        json: delegatesType,
      }),
    }),
  }),
]);
