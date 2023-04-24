import { ValidatedMessage } from "@agora/common";

export interface EmailStorage {
  addEmail(verifiedEmail: ValidatedMessage): Promise<void>;
}
