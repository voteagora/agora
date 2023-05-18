import { ethers } from "ethers";
import { makeContractInstance } from "../../contracts";
import { OptimismGovernorV5__factory } from "../../contracts/generated";
import {
  makeEntityDefinition,
  makeIndexerDefinition,
  StorageHandleForIndexer,
} from "../process";
import * as serde from "../serde";
import { RuntimeType } from "../serde";
import { efficientLengthEncodingNaturalNumbers } from "../utils/efficientLengthEncoding";
import { makeCompoundKey } from "../indexKey";
import { encodeOrdinal, logToOrdinal, ordinal } from "./ordinal";

export const governorContract = makeContractInstance({
  iface: OptimismGovernorV5__factory.createInterface(),
  address: "0xcDF27F107725988f2261Ce2256bDfCdE8B382B10",
  startingBlock: 71801427,
  env: "prod",
});

const approvalVoteModuleAddresses = [
  "0x54A8fCBBf05ac14bEf782a2060A8C752C7CC13a5",
];

export type TApprovalVoteCriteria = "THRESHOLD" | "TOP_CHOICES";

export const proposalTransactionType = serde.object({
  target: serde.string,
  value: serde.bigNumber,
  calldata: serde.string,
});

export const approvalVotingOption = serde.object({
  votes: serde.bigNumber,
  description: serde.string,
  transactions: serde.array(proposalTransactionType),
});

export const approvalVotingSettings = serde.object({
  maxApprovals: serde.number,
  criteria: serde.passthrough<TApprovalVoteCriteria>(),
  budgetToken: serde.string,
  criteriaValue: serde.bigNumber,
  budgetAmount: serde.bigNumber,
});

export const proposalDataTypes = {
  STANDARD: serde.object({
    aggregates: serde.object({
      forVotes: serde.bigNumber,
      abstainVotes: serde.bigNumber,
      againstVotes: serde.bigNumber,
    }),
    transactions: serde.array(proposalTransactionType),
  }),

  APPROVAL_VOTING: serde.object({
    proposalSettings: approvalVotingSettings,
    options: serde.array(approvalVotingOption),
    aggregates: serde.object({
      forVotes: serde.bigNumber,
      abstainVotes: serde.bigNumber,
    }),
  }),
};

export const governorIndexer = makeIndexerDefinition(governorContract, {
  name: "OptimismGovernor",
  entities: {
    QuorumNumeratorSnapshot: makeEntityDefinition({
      serde: serde.object({
        ordinal,
        quorumNumerator: serde.bigNumber,
      }),
      indexes: [
        {
          indexName: "byOrdinal",
          indexKey({ ordinal }) {
            return makeCompoundKey(
              ...encodeOrdinal(ordinal).map((it) =>
                efficientLengthEncodingNaturalNumbers(it.mul(-1))
              )
            );
          },
        },
      ],
    }),
    GovernorAggregates: makeEntityDefinition({
      serde: serde.object({
        votingDelay: serde.bigNumber,
        votingPeriod: serde.bigNumber,
        proposalThreshold: serde.bigNumber,
        totalProposals: serde.passthrough<number>(),
      }),
      indexes: [],
    }),
    Vote: makeEntityDefinition({
      serde: serde.object({
        id: serde.string,
        voterAddress: serde.string,
        proposalId: serde.bigNumber,
        support: serde.number,
        weight: serde.bigNumber,
        reason: serde.string,
        transactionHash: serde.string,
        params: serde.array(serde.number),
      }),
      indexes: [
        {
          indexName: "byProposalByVotes",
          indexKey(entity) {
            return makeCompoundKey(
              entity.proposalId.toString(),
              efficientLengthEncodingNaturalNumbers(entity.weight.mul(-1))
            );
          },
        },
        {
          indexName: "byVoter",
          indexKey(entity) {
            return entity.voterAddress;
          },
        },
      ],
    }),
    Proposal: makeEntityDefinition({
      serde: serde.object({
        proposalId: serde.bigNumber,
        proposer: serde.string,
        status: serde.passthrough<"PROPOSED" | "CANCELLED" | "EXECUTED">(),
        startBlock: serde.bigNumber,
        endBlock: serde.bigNumber,
        description: serde.string,
        proposalData: serde.discriminatedUnion(proposalDataTypes),
      }),
      indexes: [
        {
          indexName: "byEndBlock",
          indexKey(entity) {
            return efficientLengthEncodingNaturalNumbers(
              entity.endBlock.mul(-1)
            );
          },
        },
        {
          indexName: "byProposer",
          indexKey(entity) {
            return entity.proposer;
          },
        },
      ],
    }),
  },
  eventHandlers: [
    {
      signature:
        "ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)",
      async handle(handle, event) {
        handle.saveEntity("Proposal", event.args.proposalId.toString(), {
          proposalId: event.args.proposalId,
          proposer: event.args.proposer,
          status: "PROPOSED",
          startBlock: event.args.startBlock,
          endBlock: event.args.endBlock,
          description: event.args.description,

          proposalData: {
            key: "STANDARD",
            kind: {
              aggregates: {
                forVotes: ethers.BigNumber.from(0),
                abstainVotes: ethers.BigNumber.from(0),
                againstVotes: ethers.BigNumber.from(0),
              },
              transactions: event.args.targets.map((target, idx) => {
                return {
                  target,
                  value: event.args[3][idx],
                  calldata: event.args.calldatas[idx],
                };
              }),
            },
          },
        });

        const agg = await loadAggregate(handle);
        agg.totalProposals++;
        saveAggregate(handle, agg);
      },
    },
    {
      signature:
        "ProposalCreated(uint256,address,address,bytes,uint256,uint256,string)",
      async handle(handle, event) {
        if (approvalVoteModuleAddresses.includes(event.args.votingModule)) {
          const decodedProposalData = decodeProposalData(
            event.args.proposalData
          );

          handle.saveEntity("Proposal", event.args.proposalId.toString(), {
            proposalId: event.args.proposalId,
            proposer: event.args.proposer,
            status: "PROPOSED",
            startBlock: event.args.startBlock,
            endBlock: event.args.endBlock,
            description: event.args.description,

            proposalData: {
              key: "APPROVAL_VOTING",
              kind: {
                proposalSettings: {
                  ...decodedProposalData.proposalSettings,
                  criteria: toApprovalVotingCriteria(
                    decodedProposalData.proposalSettings.criteria
                  ),
                },
                options: decodedProposalData.proposalOptions.map((option) => {
                  return {
                    votes: ethers.BigNumber.from(0),
                    description: option.description,
                    transactions: option.targets.map((target, idx) => {
                      return {
                        target,
                        value: option.values[idx],
                        calldata: option.calldatas[idx],
                      };
                    }),
                  };
                }),
                aggregates: {
                  forVotes: ethers.BigNumber.from(0),
                  abstainVotes: ethers.BigNumber.from(0),
                },
              },
            },
          });

          const agg = await loadAggregate(handle);
          agg.totalProposals++;
          saveAggregate(handle, agg);
        }
      },
    },
    {
      signature: "ProposalDeadlineUpdated(uint256,uint64)",
      async handle(handle, event) {
        const proposal = (await handle.loadEntity(
          "Proposal",
          event.args.proposalId.toString()
        ))!;

        proposal.endBlock = event.args.deadline;

        handle.saveEntity(
          "Proposal",
          event.args.proposalId.toString(),
          proposal
        );
      },
    },
    {
      signature: "ProposalCanceled(uint256)",
      async handle(handle, event) {
        const proposal = (await handle.loadEntity(
          "Proposal",
          event.args.proposalId.toString()
        ))!;

        proposal.status = "CANCELLED";

        handle.saveEntity(
          "Proposal",
          event.args.proposalId.toString(),
          proposal
        );
      },
    },
    {
      signature: "ProposalExecuted(uint256)",
      async handle(handle, event) {
        const proposal = (await handle.loadEntity(
          "Proposal",
          event.args.proposalId.toString()
        ))!;

        proposal.status = "EXECUTED";

        handle.saveEntity(
          "Proposal",
          event.args.proposalId.toString(),
          proposal
        );
      },
    },
    {
      signature: "VoteCast(address,uint256,uint8,uint256,string)",
      async handle(handle, event, log) {
        const proposalId = event.args.proposalId.toString();

        const proposal = await handle.loadEntity("Proposal", proposalId);
        if (!proposal) {
          throw new Error(`vote cast on non-existing proposal: ${proposalId}`);
        }

        const supportType = toSupportType(event.args.support);

        const proposalType = proposal.proposalData.key;

        if (proposalType === "STANDARD") {
          handle.saveEntity("Proposal", proposalId, {
            ...proposal,
            proposalData: {
              ...proposal.proposalData,
              kind: {
                ...proposal.proposalData.kind,
                aggregates: {
                  forVotes: proposal.proposalData.kind.aggregates.forVotes.add(
                    supportType === "FOR" ? event.args.weight : 0
                  ),
                  againstVotes:
                    proposal.proposalData.kind.aggregates.againstVotes.add(
                      supportType === "AGAINST" ? event.args.weight : 0
                    ),
                  abstainVotes:
                    proposal.proposalData.kind.aggregates.abstainVotes.add(
                      supportType === "ABSTAIN" ? event.args.weight : 0
                    ),
                },
              },
            },
          });

          const voteId = [log.transactionHash, log.logIndex].join("|");
          handle.saveEntity("Vote", voteId, {
            id: voteId,
            voterAddress: event.args.voter,
            proposalId: event.args.proposalId,
            support: event.args.support,
            weight: event.args.weight,
            reason: (() => {
              try {
                return event.args.reason;
              } catch (e) {
                // todo: warn somewhere more visible
                console.warn(e);
                return "";
              }
            })(),
            transactionHash: log.transactionHash,
            params: [],
          });
        } else if (proposal.proposalData.key === "APPROVAL_VOTING") {
          switch (supportType) {
            case "FOR":
              // Handle FOR
              handle.saveEntity("Proposal", proposalId, {
                ...proposal,
                proposalData: {
                  ...proposal.proposalData,
                  kind: {
                    ...proposal.proposalData.kind,
                    aggregates: {
                      ...proposal.proposalData.kind.aggregates,
                      forVotes:
                        proposal.proposalData.kind.aggregates.forVotes.add(
                          event.args.weight || 0
                        ),
                    },
                  },
                },
              });
              break;
            case "ABSTAIN":
              // Handle ABSTAIN
              handle.saveEntity("Proposal", proposalId, {
                ...proposal,
                proposalData: {
                  ...proposal.proposalData,
                  kind: {
                    ...proposal.proposalData.kind,
                    aggregates: {
                      ...proposal.proposalData.kind.aggregates,
                      abstainVotes:
                        proposal.proposalData.kind.aggregates.abstainVotes.add(
                          event.args.weight
                        ),
                    },
                  },
                },
              });

              break;
            default:
              throw new Error("Unsupported support type");
          }

          const voteId = [log.transactionHash, log.logIndex].join("|");
          handle.saveEntity("Vote", voteId, {
            id: voteId,
            voterAddress: event.args.voter,
            proposalId: event.args.proposalId,
            support: event.args.support,
            weight: event.args.weight,
            reason: event.args.reason,
            transactionHash: log.transactionHash,
            params: [],
          });
        }
      },
    },
    {
      signature:
        "VoteCastWithParams(address,uint256,uint8,uint256,string,bytes)",
      async handle(handle, event, log) {
        const proposalId = event.args.proposalId.toString();

        const proposal = await handle.loadEntity("Proposal", proposalId);
        if (!proposal) {
          throw new Error(`vote cast on non-existing proposal: ${proposalId}`);
        }

        const supportType = toApprovalVotingSupportType(event.args.support);

        if (proposal.proposalData.key === "APPROVAL_VOTING") {
          switch (supportType) {
            case "FOR":
              const voteIdxs = decodeVoteParams(event.args.params);
              // Handle FOR
              handle.saveEntity("Proposal", proposalId, {
                ...proposal,
                proposalData: {
                  ...proposal.proposalData,
                  kind: {
                    ...proposal.proposalData.kind,
                    options: proposal.proposalData.kind.options.map(
                      (option, i) => {
                        if (voteIdxs.includes(i)) {
                          return {
                            ...option,
                            votes: option.votes.add(event.args.weight || 0),
                          };
                        } else {
                          return option;
                        }
                      }
                    ),
                    aggregates: {
                      ...proposal.proposalData.kind.aggregates,
                      forVotes:
                        proposal.proposalData.kind.aggregates.forVotes.add(
                          event.args.weight || 0
                        ),
                    },
                  },
                },
              });

              const id = [log.transactionHash, log.logIndex].join("|");
              handle.saveEntity("Vote", id, {
                id,
                voterAddress: event.args.voter,
                proposalId: event.args.proposalId,
                support: event.args.support,
                weight: event.args.weight,
                reason: event.args.reason,
                transactionHash: log.transactionHash,
                params: voteIdxs,
              });

              return;
            case "ABSTAIN":
              // Handle ABSTAIN
              handle.saveEntity("Proposal", proposalId, {
                ...proposal,
                proposalData: {
                  ...proposal.proposalData,
                  kind: {
                    ...proposal.proposalData.kind,
                    aggregates: {
                      ...proposal.proposalData.kind.aggregates,
                      abstainVotes:
                        proposal.proposalData.kind.aggregates.abstainVotes.add(
                          event.args.weight
                        ),
                    },
                  },
                },
              });
              break;
            default:
              throw new Error("Unsupported support type");
          }
        }

        const id = [log.transactionHash, log.logIndex].join("|");
        handle.saveEntity("Vote", id, {
          id,
          voterAddress: event.args.voter,
          proposalId: event.args.proposalId,
          support: event.args.support,
          weight: event.args.weight,
          reason: event.args.reason,
          transactionHash: log.transactionHash,
          params: [],
        });
      },
    },
    {
      signature: "QuorumNumeratorUpdated(uint256,uint256)",
      async handle(handle, event, log) {
        const ordinal = logToOrdinal(log);

        handle.saveEntity(
          "QuorumNumeratorSnapshot",
          encodeOrdinal(ordinal).join("-"),
          {
            ordinal,
            quorumNumerator: event.args.newQuorumNumerator,
          }
        );
      },
    },
    {
      signature: "VotingDelaySet(uint256,uint256)",
      async handle(handle, event) {
        const aggregate = await loadAggregate(handle);
        if (!aggregate.votingDelay.eq(event.args.oldVotingDelay)) {
          throw new Error("quorumNumerator wrong");
        }

        aggregate.votingDelay = event.args.newVotingDelay;
        saveAggregate(handle, aggregate);
      },
    },
    {
      signature: "VotingPeriodSet(uint256,uint256)",
      async handle(handle, event) {
        const aggregate = await loadAggregate(handle);
        if (!aggregate.votingPeriod.eq(event.args.oldVotingPeriod)) {
          throw new Error("quorumNumerator wrong");
        }

        aggregate.votingPeriod = event.args.newVotingPeriod;
        saveAggregate(handle, aggregate);
      },
    },
    {
      signature: "ProposalThresholdSet(uint256,uint256)",
      async handle(handle, event) {
        const aggregate = await loadAggregate(handle);
        if (!aggregate.proposalThreshold.eq(event.args.oldProposalThreshold)) {
          throw new Error("quorumNumerator wrong");
        }

        aggregate.proposalThreshold = event.args.newProposalThreshold;
        saveAggregate(handle, aggregate);
      },
    },
  ],
});

export const governanceAggregatesKey = "AGGREGATE";

export function makeDefaultGovernanceAggregate() {
  return {
    proposalThreshold: ethers.BigNumber.from(0),
    quorumNumerator: ethers.BigNumber.from(0),
    votingDelay: ethers.BigNumber.from(0),
    votingPeriod: ethers.BigNumber.from(0),
    totalProposals: 0,
  };
}

async function loadAggregate(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof governorIndexer>
) {
  const aggregates = await handle.loadEntity(
    "GovernorAggregates",
    governanceAggregatesKey
  );

  return aggregates ?? makeDefaultGovernanceAggregate();
}

function saveAggregate(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof governorIndexer>,
  entity: RuntimeType<
    typeof governorIndexer["entities"]["GovernorAggregates"]["serde"]
  >
) {
  handle.saveEntity("GovernorAggregates", governanceAggregatesKey, entity);
}

export function toSupportType(value: number): "FOR" | "AGAINST" | "ABSTAIN" {
  switch (value) {
    case 0:
      return "AGAINST";
    case 1:
      return "FOR";
    case 2:
      return "ABSTAIN";
    default:
      throw new Error(`unknown type ${value}`);
  }
}

export function toApprovalVotingSupportType(value: number): "FOR" | "ABSTAIN" {
  switch (value) {
    case 0:
      return "FOR";
    case 1:
      return "ABSTAIN";
    default:
      throw new Error(`unknown type ${value}`);
  }
}

export function toApprovalVotingCriteria(value: number): TApprovalVoteCriteria {
  switch (value) {
    case 0:
      return "THRESHOLD";
    case 1:
      return "TOP_CHOICES";
    default:
      throw new Error(`unknown type ${value}`);
  }
}

export function decodeProposalData(proposalData: string) {
  const signature =
    "PROPOSAL_DATA_ENCODING((address[] targets,uint256[] values,bytes[] calldatas,string description)[] proposalOptions,(uint8 maxApprovals,uint8 criteria,address budgetToken,uint128 criteriaValue,uint128 budgetAmount) proposalSettings)";

  const dataArgs = ethers.utils.FunctionFragment.fromString(signature);

  const decodedData = ethers.utils.defaultAbiCoder.decode(
    dataArgs.inputs,
    proposalData
  ) as ethers.utils.Result<DecodedProposalData>;

  const [maxApprovals, criteria, budgetToken, criteriaValue, budgetAmount] =
    decodedData.proposalSettings;

  const decodedProposalData: ProposalData = {
    proposalSettings: {
      maxApprovals,
      criteria,
      budgetToken,
      criteriaValue,
      budgetAmount,
    },
    proposalOptions: decodedData.proposalOptions.map((option) => {
      return {
        targets: option[0],
        values: option[1],
        calldatas: option[2],
        description: option[3],
      };
    }),
  };

  return decodedProposalData;
}

type ProposalSettingsTuple = [
  number,
  number,
  string,
  ethers.BigNumber,
  ethers.BigNumber
];

interface ProposalSettings {
  maxApprovals: number;
  criteria: number;
  budgetToken: string;
  criteriaValue: ethers.BigNumber;
  budgetAmount: ethers.BigNumber;
}

type ProposalOptionTuple = [string[], ethers.BigNumber[], string[], string];

interface ProposalOption {
  targets: string[];
  values: ethers.BigNumber[];
  calldatas: string[];
  description: string;
}

interface DecodedProposalData {
  proposalOptions: ProposalOptionTuple[];
  proposalSettings: ProposalSettingsTuple;
}

interface ProposalData {
  proposalOptions: ProposalOption[];
  proposalSettings: ProposalSettings;
}

export function decodeVoteParams(voteData: string) {
  const signature = "VOTE_PARAMS_ENCODING(uint256[] options)";

  const dataArgs = ethers.utils.FunctionFragment.fromString(signature);

  const decodedData = ethers.utils.defaultAbiCoder.decode(
    dataArgs.inputs,
    voteData
  ) as ethers.utils.Result<VoteParams>;

  const options = decodedData.options.map((option) => option.toNumber());

  return options;
}

interface VoteParams {
  options: ethers.BigNumber[];
}
