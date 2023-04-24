import { AdminMessage } from "../workers/admin/type";

import { MessageContext } from "./messageContext";

export type AdminTransport = {
  sendMessage(message: AdminMessage): Promise<void>;
};

export function adminTransportFromContext(
  context: MessageContext
): AdminTransport {
  return {
    async sendMessage(message: AdminMessage) {
      await sendAdminMessage(context, message);
    },
  };
}

async function sendAdminMessage(
  context: MessageContext,
  message: AdminMessage
) {
  while (true) {
    try {
      const response = await fetch(
        new URL("/admin/ops", context.instanceUrl).toString(),
        {
          method: "POST",
          body: JSON.stringify(message),
          headers: {
            "x-admin-api-key": context.adminApiKey,
            "x-durable-object-instance-name": context.durableObjectInstanceName,
          },
        }
      );
      if (response.status !== 200) {
        throw new Error(
          `non-200 response ${response.status} ${
            response.statusText
          } ${await response.text()}`
        );
      }
      return await response.text();
    } catch (e) {
      console.error(e);
    }
  }
}
