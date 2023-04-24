import { StoredEntry } from "../../indexer/storage/dump";

export type AdminMessage =
  | {
      type: "RESET";
    }
  | {
      type: "GET_KEYS";
      cursor?: string;
    }
  | {
      type: "START";
    }
  | {
      type: "STOP";
    }
  | {
      type: "STEP";
    }
  | {
      type: "WRITE_BATCH";
      items: StoredEntry[][];
    }
  | {
      type: "CLEAR_STORAGE";
    };
