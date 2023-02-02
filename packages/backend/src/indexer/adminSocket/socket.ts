import { AdminWebsocketMessage } from "./types";
import WebSocket from "ws";

export class AdminWebSocket {
  private websocket: WebSocket;

  constructor(websocket: WebSocket) {
    this.websocket = websocket;
  }

  async send(message: AdminWebsocketMessage): Promise<void> {
    while (true) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.websocket.send(JSON.stringify(message), (err) => {
            if (err) {
              reject(err);
            }

            resolve();
          });
        });

        return;
      } catch (e) {
        console.error(e);
        this.websocket = await openAdminWebsocket();
      }
    }
  }

  close() {
    this.websocket.close();
  }

  static async open(): Promise<AdminWebSocket> {
    const ws = await openAdminWebsocket();
    return new AdminWebSocket(ws);
  }
}

async function openAdminWebsocket() {
  const ws = new WebSocket("wss://optimism-agora-dev.act.workers.dev/admin/ws");

  await new Promise<void>((resolve, reject) => {
    ws.on("open", () => resolve());
    ws.on("error", (err) => reject(err));
  });

  return ws;
}
