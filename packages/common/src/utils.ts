import { Env } from "../../backend/src/shared/types";

export const formatAlchemyUrl = (env: Env, key: string) =>
  `https://eth-${
    env === "prod" ? "mainnet" : "sepolia"
  }.g.alchemy.com/v2/${key}`;
