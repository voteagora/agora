import { ethers } from "ethers";
import { formatAlchemyUrl } from "@agora/common";

import { requiredValue } from "./shared/utils/requiredValue";
import { Env } from "./shared/types";

export function makeProvider() {
  return makeAlchemyProvider();
}

export function makeAlchemyProvider() {
  return new ethers.providers.JsonRpcProvider(
    formatAlchemyUrl(
      (process.env.ENVIRONMENT || "dev") as Env,
      requiredValue(process.env, "ALCHEMY_API_KEY")
    )
  );
}

export function makeLocalhostProvider() {
  return new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");
}
