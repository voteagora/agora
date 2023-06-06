import { formSchema, initialFields } from "@agora/common";

import { Resolvers } from "../module";

export const Delegate: Resolvers["Delegate"] = {
  async statement({ address }, _args, { reader, statementStorage }) {
    const proxy = await reader.getEntity("AlligatorProxy", address);
    console.log("proxy", proxy);
    if (proxy) {
      return {
        address: address,
        values: formSchema.parse({
          ...initialFields(),
          delegateStatement: PROXY_STATEMENT,
        }),
      };
    }

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

const PROXY_STATEMENT =
  "This profile was automatically generated for a smart contract proxy that holds delegated votes. This address exists to give more flexibility to voters and delegates who wish to exercise more fine-grained control over their delegation.\n\nYou can view this profile to understand more about this contract address, but please do not delegate to it unless you wish to give your votes to the controller(s) of this address.";
