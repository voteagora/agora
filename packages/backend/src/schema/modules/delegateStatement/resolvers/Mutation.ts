import { ethers } from "ethers";
import { validateSigned } from "@agora/common";

import { Resolvers } from "../module";
import { StoredStatement } from "../context/statementStorage";

export const Mutation: Resolvers["Mutation"] = {
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
      "IVotesAddress",
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
