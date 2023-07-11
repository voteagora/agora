import {
  ApprovalVotingProposalDataResolvers,
  ApprovalVotingProposalOptionResolvers,
  ApprovalVotingProposalSettingsResolvers,
  DelegateResolvers,
  DelegatesOrder,
  MetricsResolvers,
  ProposalDataResolvers,
  ProposalResolvers,
  ProposalStatus,
  ProposalTransactionResolvers,
  ProposalType,
  QueryResolvers,
  StandardProposalDataResolvers,
  ThresholdVotingCriteriaResolvers,
  TopChoicesVotingCriteriaResolvers,
  VoteResolvers,
  VotingPowerResolvers,
} from "./generated/types";
import { BigNumber, ethers } from "ethers";
import {
  TApprovalVoteCriteria,
  approvalVotingOption,
  approvalVotingSettings,
  governanceAggregatesKey,
  governorIndexer,
  makeDefaultGovernanceAggregate,
  proposalDataTypes,
  proposalTransactionType,
  toApprovalVotingSupportType,
  toSupportType,
} from "../../indexer/contracts/OptimismGovernor";
import {
  aggregateCumulativeId,
  defaultAccount,
  governanceTokenIndexer,
  makeDefaultAggregate,
} from "../../indexer/contracts/GovernanceToken";
import { exactIndexValue, Reader } from "../../indexer/storage/reader";
import { entityDefinitions } from "../../indexer/contracts";
import {
  DiscriminatedUnionResolverRuntimeType,
  RuntimeType,
} from "../../indexer/serde";
import {
  collectGenerator,
  filterGenerator,
  limitGenerator,
  optimisticGenerator,
  mapGenerator,
  takeLast,
  skipFirst,
} from "../../indexer/utils/generatorUtils";
import { getTitleFromProposalDescription } from "../../utils/markdown";
import { driveReaderByIndex } from "../pagination";
import { formSchema } from "../../formSchema";
import { approximateBlockTimestampForBlock } from "../../utils/blockTimestamp";
import { makeCompoundKey } from "../../indexer/indexKey";
import { intersection } from "../../utils/set";
import { efficientLengthEncodingNaturalNumbers } from "../../indexer/utils/efficientLengthEncoding";
import {
  GovernanceToken__factory,
  OptimismGovernorV5__factory,
} from "../../contracts/generated";
import { ApprovalVotingCriteriaResolvers } from "./generated/types";
import {
  decodeArgsFromCalldata,
  knownSigHashes,
  knownTokens,
} from "../../utils/abiUtils";
import { weightedRandomizerGenerator } from "../../utils/weightedRandomizer";

const OP_TOKEN_ADDRESS = "0x4200000000000000000000000000000000000042";

const quorumDenominator = BigNumber.from(100000);

export type VotingPowerModel = BigNumber;

export const VotingPower: VotingPowerResolvers = {
  amount(value) {
    return asTokenAmount(value);
  },

  async bpsOfTotal(value, _args, { reader }) {
    const aggregate = await getAggregate(reader);

    return bpsOf(value, aggregate.totalSupply);
  },

  async bpsOfDelegatedSupply(value, _args, { reader }) {
    const aggregate = await getAggregate(reader);

    return bpsOf(value, aggregate.delegatedSupply);
  },

  async bpsOfQuorum(value, _args, { latestBlockFetcher, provider }) {
    const quorum = await getQuorum(
      provider,
      await latestBlockFetcher.getLatestBlockNumber()
    );
    return bpsOf(value, quorum);
  },
};

export type MetricsModel = {};

export const Metrics: MetricsResolvers = {
  async proposalThreshold(_parent, _args, { reader }) {
    const governorAggregates = await getGovernanceAggregate(reader);
    return governorAggregates.proposalThreshold;
  },
  async delegatedSupply(_parent, _args, { reader }) {
    const aggregate = await getAggregate(reader);
    return asTokenAmount(aggregate.delegatedSupply);
  },
  async totalSupply(_parent, _args, { reader }) {
    const aggregate = await getAggregate(reader);
    return asTokenAmount(aggregate.totalSupply);
  },
  async quorum(_parent, _args, { reader, provider, latestBlockFetcher }) {
    return await getQuorum(
      provider,
      await latestBlockFetcher.getLatestBlockNumber()
    );
  },
};

export const Query: QueryResolvers = {
  async delegate(_, { addressOrEnsName }, { ethProvider, reader }) {
    const address = await ethProvider.resolveName(addressOrEnsName);
    if (!address) {
      throw new Error("failed to resolve address");
    }

    return (
      (await reader.getEntity("Address", address)) ?? defaultAccount(address)
    );
  },

  async votes(_, { proposalId, first, after }, { reader }) {
    return driveReaderByIndex(
      reader,
      "Vote",
      "byProposalByVotes",
      first,
      after ?? null,
      {
        indexKey: makeCompoundKey(proposalId.toString(), ""),
      }
    );
  },

  metrics() {
    return {};
  },

  async proposal(_, { id }, { reader }) {
    return (await reader.getEntity("Proposal", id))!;
  },

  async proposals(_, {}, { reader }) {
    return (
      await collectGenerator(
        reader.getEntitiesByIndex("Proposal", "byEndBlock", {})
      )
    ).map((it) => it.value);
  },

  async delegates(_, { orderBy, first, where, after, seed }, { reader }) {
    if (orderBy === DelegatesOrder.WeightedRandom) {
      const readOptimizer = BigNumber.from("10000000000000000000000").div(
        (parseInt(after ?? "0") / first) * 10 || 1
      );
      const delegates = mapGenerator(
        optimisticGenerator(
          reader.getEntitiesByIndex("Address", "byTokensRepresented", {}),
          (it) => it.value.tokensRepresented.lt(readOptimizer)
        ),
        (it) => {
          return {
            ...it.value,
            weight: Number(
              parseFloat(
                ethers.utils.formatUnits(it.value.tokensRepresented, 18)
              ).toFixed(2)
            ),
          };
        }
      );

      const edges = (
        await collectGenerator(
          limitGenerator(
            skipFirst(
              weightedRandomizerGenerator(delegates, seed || ""),
              (after && parseInt(after)) || 0
            ),
            first ?? 100
          )
        )
      ).map((node, idx) => ({
        node,
        cursor: idx.toString(),
      }));

      const endCursor = (
        ((after && parseInt(after)) || 0) + edges.length
      ).toString();
      return {
        edges,
        pageInfo: {
          endCursor,
          hasNextPage: !!edges.length,
          hasPreviousPage: false,
          startCursor: null,
        },
      };
    }

    return await driveReaderByIndex(
      reader,
      "Address",
      (() => {
        switch (orderBy) {
          case DelegatesOrder.MostDelegates:
            return "byTokenHoldersRepresented";

          case DelegatesOrder.MostVotingPower:
            return "byTokensRepresented";
        }
      })(),
      first,
      after ?? null
    );
  },
};

export type DelegateModel = RuntimeType<
  typeof entityDefinitions["Address"]["serde"]
>;

export const Delegate: DelegateResolvers = {
  id({ address }) {
    return `Delegate|${address}`;
  },

  address({ address }) {
    return { address };
  },

  async statement({ address }, _args, { statementStorage }) {
    const statement = await statementStorage.getStatement(address);
    if (!statement) {
      return null;
    }

    return {
      address: address,
      values: formSchema.parse(JSON.parse(statement.signedPayload)),
    };
  },

  amountOwned({ tokensOwned }) {
    return tokensOwned;
  },

  tokensRepresented({ tokensRepresented }) {
    return tokensRepresented;
  },

  async tokensRepresentedSnapshot(
    { address },
    { proposalId },
    { provider, reader }
  ) {
    const proposal = await reader.getEntity("Proposal", proposalId);
    const normalizedAddress = ethers.utils.getAddress(address);
    return await getTokensRepresentedAtBlock(
      provider,
      normalizedAddress,
      proposal!.startBlock
    );
  },

  async delegatingTo({ delegatingTo }, _args, { reader }) {
    return (
      (await reader.getEntity("Address", delegatingTo)) ??
      defaultAccount(delegatingTo)
    );
  },

  async delegateMetrics(
    { address, accountsRepresentedCount },
    _args,
    { reader }
  ) {
    const votes = await votesForAddress(reader, address);
    const proposed = await proposedByAddress(reader, address);
    const totalProposals = (await getGovernanceAggregate(reader))
      .totalProposals;

    const lastTenProposals = (
      await collectGenerator(
        limitGenerator(
          filterGenerator(
            reader.getEntitiesByIndex("Proposal", "byEndBlock", {}),
            (value) => value.value.status !== "CANCELLED"
          ),
          10
        )
      )
    ).map((it) => it.value.proposalId.toString());

    const votedProposals = new Set(
      votes.map((vote) => vote.proposalId.toString())
    );

    const voteCount = await countVotes(votes, reader);

    return {
      tokenHoldersRepresentedCount: accountsRepresentedCount.toNumber(),
      totalVotes: votes.length,
      ...voteCount,
      ofLastTenProps: intersection(votedProposals, new Set(lastTenProposals))
        .size,
      ofTotalProps: totalProposals
        ? Math.floor((votes.length / totalProposals) * 100)
        : 0,
      proposalsCreated: proposed.length,
    };
  },

  async proposed({ address }, _args, { reader }) {
    return await proposedByAddress(reader, address);
  },

  async votes({ address }, _args, { reader }) {
    return await votesForAddress(reader, address);
  },

  async snapshotVotes({ address }, _args, { snapshotVoteStorage }) {
    return await snapshotVoteStorage.getSnapshotVotesByVoter(address);
  },
};

export type ProposalModel = RuntimeType<
  typeof entityDefinitions["Proposal"]["serde"]
>;

export const Proposal: ProposalResolvers = {
  id({ proposalId }) {
    return `Proposal|${proposalId.toString()}`;
  },

  async proposer({ proposer }, _args, { reader }) {
    return (
      (await reader.getEntity("Address", proposer)) ?? defaultAccount(proposer)
    );
  },

  number({ proposalId }) {
    return proposalId;
  },

  description({ description }) {
    return description;
  },

  async voteStartsAt({ startBlock }, _args, { provider }) {
    return approximateBlockTimestampForBlock(provider, startBlock.toNumber());
  },

  async voteEndsAt({ endBlock }, _args, { provider }) {
    return approximateBlockTimestampForBlock(provider, endBlock.toNumber());
  },

  async quorumVotes({ startBlock }, _args, { reader, provider }) {
    return {
      amount: await getQuorum(provider, startBlock),
      ...knownTokens[OP_TOKEN_ADDRESS],
    };
  },

  totalValue({ proposalData }) {
    switch (proposalData.key) {
      case "STANDARD": {
        return proposalData.kind.transactions.reduce((acc, trx) => {
          return acc.add(trx.value);
        }, ethers.BigNumber.from(0));
      }
      case "APPROVAL_VOTING": {
        return proposalData.kind.options.reduce((acc, option) => {
          return acc.add(
            option.transactions.reduce((sum, trx) => {
              return sum.add(trx.value);
            }, ethers.BigNumber.from(0))
          );
        }, ethers.BigNumber.from(0));
      }
    }
  },

  title({ description }) {
    return getTitleFromProposalDescription(description);
  },

  async totalVotes({ proposalData }, _args) {
    switch (proposalData.key) {
      case "STANDARD": {
        return proposalData.kind.aggregates.forVotes.add(
          proposalData.kind.aggregates.againstVotes
        );
      }

      case "APPROVAL_VOTING": {
        return proposalData.kind.aggregates.forVotes.add(
          proposalData.kind.aggregates.abstainVotes
        );
      }
    }
  },

  async status(
    { status, startBlock, endBlock, proposalData },
    _args,
    { reader, provider }
  ) {
    const latestBlock = reader.getLatestBlock();

    switch (status) {
      case "CANCELLED": {
        return ProposalStatus.Cancelled;
      }

      case "EXECUTED": {
        return ProposalStatus.Executed;
      }

      case "PROPOSED": {
        if (latestBlock.blockNumber <= startBlock.toNumber()) {
          return ProposalStatus.Pending;
        }

        if (latestBlock.blockNumber <= endBlock.toNumber()) {
          return ProposalStatus.Active;
        }

        const quorum = await getQuorum(provider, startBlock);

        switch (proposalData.key) {
          case "STANDARD": {
            const { forVotes, abstainVotes, againstVotes } =
              proposalData.kind.aggregates;
            const proposalQuorumVotes = forVotes.add(abstainVotes);

            if (proposalQuorumVotes.lt(quorum)) {
              return ProposalStatus.Defeated;
            }

            if (forVotes.gt(againstVotes)) {
              return ProposalStatus.Succeeded;
            }

            break;
          }
          case "APPROVAL_VOTING": {
            const { forVotes, abstainVotes } = proposalData.kind.aggregates;
            const proposalQuorumVotes = forVotes.add(abstainVotes);

            if (proposalQuorumVotes.lt(quorum)) {
              return ProposalStatus.Defeated;
            }

            if (proposalData.kind.proposalSettings.criteria === "THRESHOLD") {
              proposalData.kind.options.forEach((option) => {
                if (
                  option.votes.gt(
                    proposalData.kind.proposalSettings.criteriaValue
                  )
                ) {
                  return ProposalStatus.Succeeded;
                }
              });

              return ProposalStatus.Defeated;
            } else {
              return ProposalStatus.Succeeded;
            }
          }
        }

        return ProposalStatus.Queued;
      }
    }
  },

  proposalData(proposal) {
    return {
      proposal,
      proposalData: proposal.proposalData,
    };
  },
};

export type ProposalDataModel = {
  proposal: ProposalModel;
  proposalData: ProposalModel["proposalData"];
};

export const ProposalData: ProposalDataResolvers = {
  __resolveType({ proposalData }) {
    switch (proposalData.key) {
      case ProposalType.Standard:
        return "StandardProposalData";

      case ProposalType.ApprovalVoting:
        return "ApprovalVotingProposalData";

      default:
        throw new Error(`unknown event type ${proposalData.key}`);
    }
  },
};

export type StandardProposalDataModel = {
  proposal: ProposalModel;
  proposalData: DiscriminatedUnionResolverRuntimeType<
    typeof proposalDataTypes,
    "STANDARD"
  >;
};

export const StandardProposalData: StandardProposalDataResolvers = {
  transactions({
    proposalData: {
      kind: { transactions },
    },
  }) {
    return transactions;
  },

  forVotes({ proposalData: { kind } }) {
    return asTokenAmount(kind.aggregates.forVotes);
  },

  againstVotes({ proposalData: { kind } }) {
    return asTokenAmount(kind.aggregates.againstVotes);
  },

  abstainVotes({ proposalData: { kind } }) {
    return asTokenAmount(kind.aggregates.abstainVotes);
  },
};

export type ApprovalVotingProposalDataModel = {
  proposal: ProposalModel;
  proposalData: DiscriminatedUnionResolverRuntimeType<
    typeof proposalDataTypes,
    "APPROVAL_VOTING"
  >;
};

export const ApprovalVotingProposalData: ApprovalVotingProposalDataResolvers = {
  settings({
    proposalData: {
      kind: { proposalSettings },
    },
  }) {
    return proposalSettings;
  },

  options({
    proposalData: {
      kind: { options, proposalSettings },
    },
  }) {
    return options.map((option) => {
      return { ...option, budgetToken: proposalSettings.budgetToken };
    });
  },

  forVotes({ proposalData: { kind } }) {
    return asTokenAmount(kind.aggregates.forVotes);
  },

  abstainVotes({ proposalData: { kind } }) {
    return asTokenAmount(kind.aggregates.abstainVotes);
  },
};

export type ApprovalVotingProposalOptionModel = RuntimeType<
  typeof approvalVotingOption
> & { budgetToken: string };

export const ApprovalVotingProposalOption: ApprovalVotingProposalOptionResolvers =
  {
    votes({ votes }) {
      return asTokenAmount(votes);
    },

    description({ description }) {
      return description;
    },

    transactions({ transactions }) {
      return transactions;
    },

    budgetTokensSpent({ transactions, budgetToken }) {
      const budgetTokenSpec = knownTokens[budgetToken];
      if (budgetTokenSpec && budgetTokenSpec.currency === "ETH") {
        const amount = transactions.reduce(
          (acc, tx) => acc.add(tx.value),
          BigNumber.from(0)
        );
        return asTokenAmountFromSpec(budgetTokenSpec, amount);
      } else {
        const amount = transactions.reduce((acc, tx) => {
          const decoded = decodeArgsFromCalldata(tx.calldata);
          for (const val of decoded) {
            if (val instanceof BigNumber) {
              return acc.add(val);
            }
          }
          return acc;
        }, BigNumber.from(0));

        if (!budgetTokenSpec) {
          return asUnknownTokenAmount(amount, budgetToken);
        }

        return asTokenAmountFromSpec(budgetTokenSpec, amount);
      }
    },
  };

export type ApprovalVotingProposalSettingsModel = RuntimeType<
  typeof approvalVotingSettings
>;

export const ApprovalVotingProposalSettings: ApprovalVotingProposalSettingsResolvers =
  {
    maxApprovals({ maxApprovals }) {
      return maxApprovals;
    },

    criteria(criteria) {
      return criteria;
    },

    budget({ budgetToken, budgetAmount }) {
      const currencySpec = knownTokens[budgetToken];
      if (currencySpec) {
        return asTokenAmountFromSpec(currencySpec, budgetAmount);
      }
      return asUnknownTokenAmount(budgetAmount, budgetToken);
    },
  };

export type ApprovalVotingCriteriaModel = {
  criteria: TApprovalVoteCriteria;
  criteriaValue: BigNumber;
  budgetToken: string;
};

export const ApprovalVotingCriteria: ApprovalVotingCriteriaResolvers = {
  __resolveType({ criteria, criteriaValue }) {
    switch (criteria) {
      case "THRESHOLD":
        return "ThresholdVotingCriteria";
      case "TOP_CHOICES":
        return "TopChoicesVotingCriteria";
      default:
        throw new Error(`unknown criteria ${criteria}`);
    }
  },
};

export type ThresholdVotingCriteriaModel = ApprovalVotingCriteriaModel;

export const ThresholdVotingCriteria: ThresholdVotingCriteriaResolvers = {
  threshold({ criteriaValue }) {
    const currencySpec = knownTokens[OP_TOKEN_ADDRESS];
    if (currencySpec) {
      return asTokenAmountFromSpec(currencySpec, criteriaValue);
    }
    return asUnknownTokenAmount(criteriaValue, OP_TOKEN_ADDRESS);
  },
};

export type TopChoicesVotingCriteriaModel = ApprovalVotingCriteriaModel;

export const TopChoicesVotingCriteria: TopChoicesVotingCriteriaResolvers = {
  topChoices({ criteriaValue }) {
    return criteriaValue.toNumber();
  },
};

export type ProposalTransactionModel = RuntimeType<
  typeof proposalTransactionType
>;

export const ProposalTransaction: ProposalTransactionResolvers = {
  target({ target }) {
    return { address: target };
  },

  signature({ calldata }) {
    const signatureFromKnownSigHashes = knownSigHashes[calldata.slice(0, 10)];
    if (signatureFromKnownSigHashes) {
      return signatureFromKnownSigHashes;
    }

    return calldata.slice(0, 10);
  },

  calldata({ calldata }) {
    return "0x" + calldata.slice(10);
  },

  functionName({ calldata }) {
    const signatureFromKnownSigHashes = knownSigHashes[calldata.slice(0, 10)];
    if (signatureFromKnownSigHashes) {
      return signatureFromKnownSigHashes.split("(")[0];
    }

    return "unknown";
  },

  functionArgs({ calldata }) {
    const decoded = decodeArgsFromCalldata(calldata);
    return Array.from(decoded).map((arg) => {
      if (arg instanceof BigNumber) {
        return arg.toString();
      } else if (typeof arg === "object") {
        return JSON.stringify(arg);
      } else {
        return arg.toString();
      }
    });
  },
};

export type VoteModel = RuntimeType<typeof entityDefinitions["Vote"]["serde"]>;

export const Vote: VoteResolvers = {
  id({ id }) {
    return `Vote|${id}`;
  },

  async proposal({ proposalId }, _args, { reader }) {
    return (await reader.getEntity("Proposal", proposalId.toString()))!;
  },

  reason({ reason }) {
    return reason;
  },

  supportDetailed({ support }) {
    return support;
  },

  async transaction({ transactionHash }, _args, { provider }) {
    return await provider.getTransaction(transactionHash);
  },

  votes({ weight }) {
    return weight;
  },
  async voter({ voterAddress }, _args, { reader }) {
    return (
      (await reader.getEntity("Address", voterAddress)) ??
      defaultAccount(voterAddress)
    );
  },

  async options({ params, proposalId }, _arg, { reader }) {
    const proposal = await reader.getEntity("Proposal", proposalId.toString());
    const propoalData = proposal?.proposalData;
    if (propoalData?.key === "APPROVAL_VOTING") {
      return params.map((idx) => {
        return {
          ...propoalData.kind.options[idx],
          budgetToken: propoalData.kind.proposalSettings.budgetToken,
        };
      });
    }
    return [];
  },
};

async function votesForAddress(
  reader: Reader<typeof entityDefinitions>,
  address: string
) {
  const normalizedAddress = ethers.utils.getAddress(address);
  return await collectGenerator(
    (async function* () {
      for await (const { value } of reader.getEntitiesByIndex(
        "Vote",
        "byVoter",
        exactIndexValue(normalizedAddress)
      )) {
        if (value.voterAddress !== normalizedAddress) {
          return;
        }

        yield value;
      }
    })()
  );
}

async function proposedByAddress(
  reader: Reader<typeof entityDefinitions>,
  address: string
) {
  const normalizedAddress = ethers.utils.getAddress(address);
  return await collectGenerator(
    (async function* () {
      for await (const { value } of reader.getEntitiesByIndex(
        "Proposal",
        "byProposer",
        exactIndexValue(normalizedAddress)
      )) {
        if (value.proposer !== normalizedAddress) {
          return;
        }

        yield value;
      }
    })()
  );
}

async function getQuorumNumeratorSnapshot(
  reader: Reader<typeof entityDefinitions>,
  blockNumber: BigNumber | null
) {
  return await takeLast(
    reader.getEntitiesByIndex("QuorumNumeratorSnapshot", "byOrdinal", {
      ...(() => {
        if (!blockNumber) {
          return;
        }

        return {
          starting: {
            indexKey: makeCompoundKey(
              efficientLengthEncodingNaturalNumbers(blockNumber.mul(-1)),
              ""
            ),
          },
        };
      })(),
    })
  );
}

async function getTotalSupplySnapshot(
  reader: Reader<typeof entityDefinitions>,
  blockNumber: BigNumber | null
) {
  return await takeLast(
    reader.getEntitiesByIndex("TotalSupplySnapshot", "byOrdinal", {
      ...(() => {
        if (!blockNumber) {
          return;
        }

        return {
          starting: {
            indexKey: makeCompoundKey(
              efficientLengthEncodingNaturalNumbers(blockNumber.mul(-1)),
              ""
            ),
          },
        };
      })(),
    })
  );
}

async function getQuorum(
  provider: ethers.providers.BaseProvider,
  blockNumber: BigNumber
): Promise<BigNumber> {
  const governor = OptimismGovernorV5__factory.connect(
    governorIndexer.address,
    provider
  );

  return await governor.quorum(blockNumber);
}

async function getTokensRepresentedAtBlock(
  provider: ethers.providers.BaseProvider,
  address: string,
  blockNumber: BigNumber
): Promise<BigNumber> {
  const governor = GovernanceToken__factory.connect(
    governanceTokenIndexer.address,
    provider
  );
  return await governor.getPastVotes(address, blockNumber);
}

async function getAggregate(reader: Reader<typeof entityDefinitions>) {
  return (
    (await reader.getEntity("Aggregates", aggregateCumulativeId)) ??
    makeDefaultAggregate()
  );
}

async function getGovernanceAggregate(
  reader: Reader<typeof entityDefinitions>
) {
  return (
    (await reader.getEntity("GovernorAggregates", governanceAggregatesKey)) ??
    makeDefaultGovernanceAggregate()
  );
}

function bpsOf(top: BigNumber, bottom: BigNumber): number {
  if (bottom.eq(BigNumber.from(0))) {
    return 0;
  }

  return Math.round(
    top
      .mul(100 * 100)
      .div(bottom)
      .toNumber()
  );
}

function asTokenAmount(amount: BigNumber) {
  return {
    amount,
    ...knownTokens[OP_TOKEN_ADDRESS],
  };
}

type TokenSpec = {
  currency: string;
  decimals: number;
};

function asTokenAmountFromSpec(spec: TokenSpec, amount: BigNumber) {
  return {
    amount,
    ...spec,
  };
}

function asUnknownTokenAmount(amount: BigNumber, currency: string) {
  return {
    amount,
    currency,
    decimals: 0,
  };
}

async function countVotes(
  votes: RuntimeType<typeof entityDefinitions["Vote"]["serde"]>[],
  reader: Reader<typeof entityDefinitions>
) {
  return await votes.reduce(async (accPromise, vote) => {
    const acc = await accPromise;
    const proposal = await reader.getEntity(
      "Proposal",
      vote.proposalId.toString()
    );

    const voteSupportType = resolveForAgainstAbstain(vote, proposal!);

    switch (voteSupportType) {
      case "FOR":
        return { ...acc, forVotes: acc.forVotes + 1 };
      case "ABSTAIN":
        return { ...acc, abstainVotes: acc.abstainVotes + 1 };
      case "AGAINST":
        return { ...acc, againstVotes: acc.againstVotes + 1 };
    }
  }, Promise.resolve({ forVotes: 0, abstainVotes: 0, againstVotes: 0 }));
}

function resolveForAgainstAbstain(
  vote: RuntimeType<typeof entityDefinitions["Vote"]["serde"]>,
  proposal: RuntimeType<typeof entityDefinitions["Proposal"]["serde"]>
) {
  console.log(vote, proposal);

  switch (proposal.proposalData.key) {
    case "APPROVAL_VOTING": {
      return toApprovalVotingSupportType(vote.support);
    }
    case "STANDARD": {
      return toSupportType(vote.support);
    }
  }
}
