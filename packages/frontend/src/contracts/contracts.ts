import { makeContractInstance } from "../hooks/useContractWrite";
import { OptimismGovernorV5__factory } from "./generated";
import { GovernanceToken__factory } from "./generated/factories/GovernanceToken__factory";

export const governanceTokenContract = makeContractInstance({
  factory: GovernanceToken__factory,
  address: "0x4200000000000000000000000000000000000042",
  startingBlock: 6490467,
});

export const governorTokenContract = makeContractInstance({
  factory: OptimismGovernorV5__factory,
  address:
    process.env.REACT_APP_OP_GOV_ADDRESS ||
    "0x6E17cdef2F7c1598AD9DfA9A8acCF84B1303f43f",
  startingBlock: Number(process.env.REACT_APP_OP_GOV_START_BLOCK || 96417216),
});
