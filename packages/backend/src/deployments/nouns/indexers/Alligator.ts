import { nounsAlligator } from "@agora/common";

import { makeAlligatorIndexer } from "../../../shared/contracts/indexers/Alligator/Alligator";
import { intoContractInstance } from "../../../shared/indexer/process/contractInstance";

export const alligatorIndexer = makeAlligatorIndexer(
  intoContractInstance(nounsAlligator),
  "Alligator"
);
