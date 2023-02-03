import { StoredEntry } from "../storage/dump";

export type AdminMessage =
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
      await fetch("https://optimism-agora-dev.act.workers.dev/admin/ops", {
        method: "POST",
        body: JSON.stringify(message),
      });
      return;
    } catch (e) {
      console.error(e);
    }
  }
}
