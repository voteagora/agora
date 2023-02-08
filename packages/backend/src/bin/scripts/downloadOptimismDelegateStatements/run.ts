import { fetchOptimismDelegates } from "./optimismClaimsService";
import { promises as fs } from "fs";
import "isomorphic-fetch";

async function main() {
  const delegates = await fetchOptimismDelegates();
  await fs.writeFile(
    "./data/optimismStatements/statements.json",
    JSON.stringify(delegates)
  );
}

main();
