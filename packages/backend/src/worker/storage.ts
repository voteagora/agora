import { EmailStorage } from "../model";
import { ValidatedMessage } from "../utils/signing";

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
