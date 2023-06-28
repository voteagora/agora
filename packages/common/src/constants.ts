import { Env } from "../../backend/src/shared/types";

import {
  nounsDao,
  nounsToken,
  nounsAlligator,
  nounsDaoSepolia,
  nounsTokenSepolia,
  nounsAlligatorSepolia,
} from "./contracts";

export const constants = (env: Env) =>
  env === "prod"
    ? {
        nounsDao,
        nounsToken,
        nounsAlligator,
        network: "mainnet",
      }
    : {
        nounsDao: nounsDaoSepolia,
        nounsToken: nounsTokenSepolia,
        nounsAlligator: nounsAlligatorSepolia,
        network: "sepolia",
      };
