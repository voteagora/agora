import { StoredEntry } from "../storage/dump";

export type AdminMessage =
  | {
      type: "START";
    }
  | {
      type: "WRITE_BATCH";
      items: StoredEntry[][];
    }
  | {
      type: "CLEAR_STORAGE";
    };

export async function sendAdminMessage(message: AdminMessage) {
  while (true) {
    try {
      const response = await fetch(
        "https://optimism-agora-dev.act.workers.dev/admin/ops",
        {
          method: "POST",
          body: JSON.stringify(message),
        }
      );
      if (response.status !== 200) {
        throw new Error(
          `non-200 response ${response.status} ${
            response.statusText
          } ${await response.text()}`
        );
      }
      return;
    } catch (e) {
      console.error(e);
    }
  }
}
