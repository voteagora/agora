import { messageContextFromEnv } from "../messageContext";
import { adminTransportFromContext } from "../adminMessage";
import { pathForDeployment } from "../../indexer/paths";

import { load } from "./load";

async function main() {
  const deployment = "nouns";
  const dataDirectory = pathForDeployment(deployment);
  const adminMessageContext = messageContextFromEnv(deployment);

  const adminTransport = adminTransportFromContext(adminMessageContext);

  const [command] = process.argv.slice(2);

  switch (command) {
    case "start": {
      await adminTransport.sendMessage({ type: "START" });
      break;
    }

    case "stop": {
      await adminTransport.sendMessage({ type: "STOP" });
      break;
    }

    case "step": {
      await adminTransport.sendMessage({ type: "STEP" });
      break;
    }

    case "load": {
      await load(adminTransport, dataDirectory);
      break;
    }

    default: {
      throw new Error(`unknown command ${command}`);
    }
  }
}

main();
