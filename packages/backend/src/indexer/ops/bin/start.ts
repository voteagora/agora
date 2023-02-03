import "isomorphic-fetch";
import { sendAdminMessage } from "../adminMessage";

export async function main() {
  await sendAdminMessage({
    type: "START",
  });
}

main();
