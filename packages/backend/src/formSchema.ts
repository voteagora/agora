import { z, ZodArray, ZodTypeAny } from "zod";

const topIssueSchema = z
  .object({
    type: z.union([
      z.literal("proliferation"),
      z.literal("treasury"),
      z.literal("funding"),
    ]),
    value: z.string(),
  })
  .strict();

const selectedProposalSchema = z
  .object({
    number: z.number(),
  })
  .strict();

function ensureUnique<T extends ZodTypeAny>(
  array: ZodArray<T>,
  extractKey: (item: T["_output"]) => string,
  message: string
) {
  return array.refine(
    (value) => value.length === new Set(value.map((it) => extractKey(it))).size,
    message
  );
}

export const formSchema = z
  .object({
    for: z.literal("nouns-agora"),
    delegateStatement: z.string(),
    topIssues: z.array(topIssueSchema),
    mostValuableProposals: z.array(selectedProposalSchema),
    leastValuableProposals: z.array(selectedProposalSchema),
    twitter: z.string(),
    discord: z.string(),
    openToSponsoringProposals: z.union([
      z.literal("yes"),
      z.literal("no"),
      z.null(),
    ]),
  })
  .strict();
