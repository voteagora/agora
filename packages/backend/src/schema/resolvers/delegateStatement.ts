import {
  extractFirstParagraph,
  trimENSStatementHeader,
} from "../../utils/markdown";
import { marked } from "marked";
import {
  DelegateStatementResolvers,
  MutationResolvers,
} from "./generated/types";
import { formSchema } from "../../formSchema";
import { z } from "zod";
import { validateSigned } from "../../utils/signing";
import { StoredStatement } from "../model";
import { ethers } from "ethers";

export type DelegateStatementModel = {
  address: string;
  values: z.TypeOf<typeof formSchema>;
};

export const DelegateStatement: DelegateStatementResolvers = {
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

export const Mutation: MutationResolvers = {
  async createNewDelegateStatement(
    parent,
    args,
    { statementStorage, emailStorage, provider, reader },
    info
  ) {
    const updatedAt = Date.now();
    const validated = await validateSigned(provider, args.data.statement);

    const nextStatement: StoredStatement = {
      address: validated.address,
      signedPayload: validated.value,
      signature: validated.signature,
      signatureType: validated.signatureType,
      updatedAt,
    };

    const delegate = (await reader.getEntity(
      "Address",
      ethers.utils.getAddress(validated.address)
    ))!;

    await statementStorage.addStatement(nextStatement);

    if (args.data.email) {
      await emailStorage.addEmail(
        await validateSigned(provider, args.data.email)
      );
    }

    return { ...delegate, statement: nextStatement };
  },
};
