import { formSchema } from "@agora/common";

import { Resolvers } from "../module";

export const Delegate: Resolvers["Delegate"] = {
  async statement({ address }, _args, { statementStorage }) {
    const statement = await statementStorage.getStatement(address);
    if (!statement) {
      return null;
    }

    return {
      address: address,
      values: formSchema.parse(JSON.parse(statement.signedPayload)),
    };
  },
};
