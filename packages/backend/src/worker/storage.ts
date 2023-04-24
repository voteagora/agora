import { ValidatedMessage } from "@agora/common";

import { EmailStorage } from "../schema/modules/delegateStatement/context/emailStorage";

export function makeEmailStorage(kvNamespace: KVNamespace): EmailStorage {
  return {
    async addEmail(verifiedEmail: ValidatedMessage): Promise<void> {
      await kvNamespace.put(
        verifiedEmail.address,
        JSON.stringify({
          signature: verifiedEmail.signature,
          value: verifiedEmail.value,
        })
      );
    },
  };
}
