import { z } from "zod";
import { marked } from "marked";
import { formSchema } from "@agora/common";

import {
  extractFirstParagraph,
  trimENSStatementHeader,
} from "../../../../utils/markdown";
import { Resolvers } from "../module";

export type DelegateStatementModel = {
  address: string;
  values: z.TypeOf<typeof formSchema>;
};

export const DelegateStatement: Resolvers["DelegateStatement"] = {
  summary({ values: { delegateStatement } }) {
    return extractFirstParagraph(
      marked.lexer(trimENSStatementHeader(delegateStatement.slice(0, 1000)))
    );
  },

  statement({ values: { delegateStatement } }) {
    return delegateStatement;
  },

  topIssues({ values: { topIssues } }) {
    return topIssues as any;
  },

  async leastValuableProposals(
    { values: { leastValuableProposals } },
    args,
    context,
    info
  ) {
    // todo: implement
    return [];
  },

  async mostValuableProposals(
    { values: { mostValuableProposals } },
    args,
    context,
    info
  ) {
    // todo: implement
    return [];
  },

  discord({ values: { discord } }) {
    return discord;
  },

  twitter({ values: { twitter } }) {
    return twitter;
  },

  openToSponsoringProposals({ values: { openToSponsoringProposals } }) {
    switch (openToSponsoringProposals) {
      case "yes":
        return true;

      case "no":
        return false;

      default:
        return null;
    }
  },
};
