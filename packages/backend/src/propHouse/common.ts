import { z } from "zod";

export const basePath = "https://prod.backend.prop.house/";

export const signedData = z.union([
  z.object({
    message: z.string(),
    signature: z.string(),
    signer: z.string(),
  }),
  z.object({
    no_data: z.string(),
  }),
  z.object({
    mulstig: z.string(),
  }),
]);

export const proposal = z.object({
  id: z.number(),
  auctionId: z.number(),
  address: z.string(),

  title: z.string(),
  tldr: z.string(),
  what: z.string(),
  signedData,

  createdDate: z.string(),
  lastUpdatedDate: z.string().or(z.null()),
  visible: z.boolean(),
  voteCount: z.string(),
});
