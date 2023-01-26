import { makeContractInstance } from "../hooks/useContractWrite";
import { OptimismGovernorV1__factory } from "./generated";
import { GovernanceToken__factory } from "./generated/factories/GovernanceToken__factory";

export const governanceTokenContract = makeContractInstance({
  factory: GovernanceToken__factory,
  address: "0x4200000000000000000000000000000000000042",
  startingBlock: 6490467,
});

export const governorTokenContract = makeContractInstance({
  factory: OptimismGovernorV1__factory,
  address: "0x4200dfa134da52d9c96f523af1fcb507199b1042",
  startingBlock: 60786205,
});
