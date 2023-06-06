import { nounsAlligator, nounsAlligatorSepolia } from "@agora/common";

import { makeAlligatorIndexer } from "../../../shared/contracts/indexers/Alligator/Alligator";
import { intoContractInstance } from "../../../shared/indexer/process/contractInstance";

export const alligatorIndexer = makeAlligatorIndexer(
  intoContractInstance(nounsAlligator),
  "Alligator"
);

export const alligatorIndexerSepolia = makeAlligatorIndexer(
  intoContractInstance(nounsAlligatorSepolia),
  "Alligator"
);
