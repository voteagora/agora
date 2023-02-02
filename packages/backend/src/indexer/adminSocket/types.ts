import { StoredEntry } from "../storage/dump";

export type AdminWebsocketMessage = {
  type: "WRITE_BATCH";
  items: StoredEntry[];
};
