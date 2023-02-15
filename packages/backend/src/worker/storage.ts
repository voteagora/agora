import { EmailStorage } from "../schema/model";
import { ValidatedMessage } from "../utils/signing";
import { KVNamespace } from "@cloudflare/workers-types";

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
