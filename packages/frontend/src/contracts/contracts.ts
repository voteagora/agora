import { makeContractInstance } from "../hooks/useContractWrite";
import { OptimismGovernorV5__factory } from "./generated";
import { GovernanceToken__factory } from "./generated/factories/GovernanceToken__factory";

export const governanceTokenContract = makeContractInstance({
  factory: GovernanceToken__factory,
  address: "0x4200000000000000000000000000000000000042",
  startingBlock: 6490467,
});

const governorAddress =
  process.env.REACT_APP_DEPLOY_ENV === "prod"
    ? "0xcDF27F107725988f2261Ce2256bDfCdE8B382B10"
    : "0x6E17cdef2F7c1598AD9DfA9A8acCF84B1303f43f";

const governorStartingBlock =
  process.env.REACT_APP_DEPLOY_ENV === "prod" ? 71801427 : 96417216;

export const governorTokenContract = makeContractInstance({
  factory: OptimismGovernorV5__factory,
  address: governorAddress,
  startingBlock: governorStartingBlock,
});

export const approvalModuleAddress =
  "0x54A8fCBBf05ac14bEf782a2060A8C752C7CC13a5";

export const opAdminAddress = "0x2501c477D0A35545a387Aa4A3EEe4292A9a8B3F0";
