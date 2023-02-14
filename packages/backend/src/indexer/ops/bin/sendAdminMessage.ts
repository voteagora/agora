import "isomorphic-fetch";
import { sendAdminMessage } from "../adminMessage";

export async function main() {
  await sendAdminMessage({
    type: (() => {
      const command = process.argv[2];
      switch (command) {
        case "START":
        case "STOP":
        case "STEP":
        case "RESET":
          return command;

        default:
          throw new Error(`invalid command ${command}`);
      }
    })(),
  });
}

main();
