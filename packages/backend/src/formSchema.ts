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
    id: z.string(),
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

const proposalsListSchema = ensureUnique(
  z.array(selectedProposalSchema),
  (it) => it.id,
  "same proposal selected multiple times"
);

export const formSchema = z
  .object({
    for: z.literal("nouns-agora"),
    delegateStatement: z.string(),
    topIssues: z.array(topIssueSchema),
    mostValuableProposals: proposalsListSchema,
    leastValuableProposals: proposalsListSchema,
    twitter: z.string(),
    discord: z.string(),
    openToSponsoringProposals: z.union([
      z.literal("yes"),
      z.literal("no"),
      z.null(),
    ]),
  })
  .strict()
  .refine(
    (value) =>
      value.leastValuableProposals.length +
        value.mostValuableProposals.length ===
      new Set([
        ...value.leastValuableProposals.map((it) => it.id),
        ...value.mostValuableProposals.map((it) => it.id),
      ]).size,
    "same proposals in both least valuable and most valuable"
  );
