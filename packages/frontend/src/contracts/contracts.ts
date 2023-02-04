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
  address: "0xcDF27F107725988f2261Ce2256bDfCdE8B382B10",
  startingBlock: 71801427,
});
