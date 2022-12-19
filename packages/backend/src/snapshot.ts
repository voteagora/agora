import { ethers } from "ethers";
import { GovernanceToken__factory } from "./contracts/generated";
import { BigNumber } from "ethers";
import { ToucanInterface, withSentryScope } from "./sentry";
import { getAllLogs } from "./events";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { GovernanceTokenInterface } from "./contracts/generated/GovernanceToken";
import { chunk, isEqual } from "lodash";
import { makeUpdateForAccount } from "./store/dynamo/delegates";

export interface TypedInterface extends ethers.utils.Interface {
  events: Record<string, ethers.utils.EventFragment<Record<string, any>>>;
}

export function makeContractInstance<InterfaceType extends TypedInterface>(
  t: ContractInstance<InterfaceType>
): ContractInstance<InterfaceType> {
  return t;
}

type ContractInstance<InterfaceType extends TypedInterface> = {
  iface: InterfaceType;
  address: string;
  startingBlock: number;
};
type ReducerDefinition<
  InterfaceType extends TypedInterface,
  Accumulator,
  RawState
> = ContractInstance<InterfaceType> & {
  eventHandlers: EventHandler<InterfaceType, Accumulator>[];
  dumpChangesToDynamo?: (
    dynamo: DynamoDB,
    oldState: Accumulator,
    newState: Accumulator
  ) => Promise<void>;
} & StorageDefinition<Accumulator, RawState>;

type StorageDefinition<State, RawState> = {
  name: string;
  initialState: () => State;
  decodeState: (rawState: RawState) => State;
  encodeState: (state: State) => RawState;
};

type EventHandler<InterfaceType extends TypedInterface, Accumulator> = {
  [K in keyof InterfaceType["events"] & string]: {
    signature: K;
    reduce: (
      acc: Accumulator,
      event: ethers.utils.LogDescription<
        K,
        EventFragmentArg<InterfaceType["events"][K]>
      >,
      log: ethers.providers.Log
    ) => Promise<Accumulator> | Accumulator;
  };
}[keyof InterfaceType["events"] & string];

type EventFragmentArg<T> = T extends ethers.utils.EventFragment<infer Args>
  ? Args
  : never;

export type GovernanceTokenState = {
  accounts: Map<string, GovernanceAccount>;

  totalSupply: BigNumber;
  delegatedSupply: BigNumber;
};

export type GovernanceAccount = {
  balance: BigNumber;
  delegatingTo: string | null;

  represented: BigNumber;
  representing: string[];
};

type GovernanceAccountRaw = {
  balance: string;
  delegatingTo: string | null;
  representing: string[];
  represented: string;
};

type GovernanceStateRaw = {
  accounts: [string, GovernanceAccountRaw][];

  totalSupply: string;
  delegatedSupply: string;
};

function encodeAccountEntry([key, value]: [string, GovernanceAccount]): [
  string,
  GovernanceAccountRaw
] {
  return [
    key.toLowerCase(),
    {
      ...value,
      representing: value.representing.map((address) => address.toLowerCase()),
      balance: value.balance.toString(),
      represented: value.represented.toString(),
    },
  ];
}

export const governanceTokenStorage: StorageDefinition<
  GovernanceTokenState,
  GovernanceStateRaw
> = {
  name: "GovernanceToken",
  initialState: () => ({
    accounts: new Map<string, GovernanceAccount>(),
    totalSupply: BigNumber.from(0),
    delegatedSupply: BigNumber.from(0),
  }),
  encodeState(acc) {
    return {
      accounts: Array.from(acc.accounts.entries())
        .sort(([, a], [, b]) => (a.represented.gt(b.represented) ? -1 : 1))
        .map((args) => encodeAccountEntry(args)),

      delegatedSupply: acc.delegatedSupply.toString(),
      totalSupply: acc.totalSupply.toString(),
    };
  },
  decodeState(state) {
    return {
      accounts: new Map(
        state.accounts.map(([key, value]) => [
          key,
          {
            balance: ethers.BigNumber.from(value.balance),
            delegatingTo: value.delegatingTo,
            representing: value.representing,
            represented: BigNumber.from(value.represented),
          },
        ])
      ),
      totalSupply: BigNumber.from(state.totalSupply),
      delegatedSupply: BigNumber.from(state.delegatedSupply),
    };
  },
};

export type Proposal = {
  id: BigNumber;
  proposer: string;
  startBlock: BigNumber;
  endBlock: BigNumber;
  description: string;

  targets: string[];
  values: BigNumber[];
  signatures: string[];
  calldatas: string[];

  status:
    | { type: "CREATED" }
    | { type: "CANCELLED" }
    | { type: "EXECUTED" }
    | { type: "QUEUED"; activatedAt: BigNumber };
};

export type Vote = {
  blockHash: string;
  transactionHash: string;
  proposalId: BigNumber;
  voter: string;
  support: number;
  weight: BigNumber;
  reason: string;
};

type GovernorState = {
  proposals: Map<string, Proposal>;
  votes: Array<Vote>;
  quorumNumerator: BigNumber;
};

type ProposalRaw = {
  id: string;
  proposer: string;
  startBlock: string;
  endBlock: string;
  description: string;

  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];

  status: string;
  activatedAt?: string;
};

type VoteRaw = {
  blockHash: string;
  transactionHash: string;
  proposalId: string;
  voter: string;
  support: number;
  weight: string;
  reason: string;
};

type GovernorStateRaw = {
  proposals: [string, ProposalRaw][];
  votes: VoteRaw[];
  quorumNumerator: string;
};

export const governorStorage: StorageDefinition<
  GovernorState,
  GovernorStateRaw
> = {
  name: "Governor",

  initialState() {
    return {
      proposals: new Map(),
      votes: [],
      quorumNumerator: BigNumber.from(10),
    };
  },

  encodeState(state) {
    return {
      proposals: Array.from(state.proposals.entries()).map(
        ([proposalId, proposal]): [string, ProposalRaw] => [
          proposalId,
          {
            ...proposal,
            id: proposal.id.toString(),
            startBlock: proposal.startBlock.toString(),
            endBlock: proposal.endBlock.toString(),
            values: proposal.values.map((value) => value.toString()),
            status: proposal.status.type,
            activatedAt: proposal.status["activatedAt"]?.toString(),
          },
        ]
      ),
      votes: state.votes.map((vote) => ({
        blockHash: vote.blockHash,
        transactionHash: vote.transactionHash,
        proposalId: vote.proposalId.toString(),
        voter: vote.voter,
        support: vote.support,
        weight: vote.weight.toString(),
        reason: vote.reason,
      })),
      quorumNumerator: state.quorumNumerator.toString(),
    };
  },

  decodeState(rawState: GovernorStateRaw) {
    return {
      proposals: new Map(
        rawState.proposals.map(([proposalId, proposal]): [string, Proposal] => [
          proposalId,
          {
            ...proposal,
            id: BigNumber.from(proposal.id),
            values: proposal.values.map((it) => BigNumber.from(it)),
            status: {
              type: proposal.status as any,
              activatedAt: proposal.activatedAt
                ? BigNumber.from(proposal.activatedAt)
                : undefined,
            },
            proposer: proposal.proposer,
            startBlock: BigNumber.from(proposal.startBlock),
            endBlock: BigNumber.from(proposal.endBlock),
          },
        ])
      ),
      votes: rawState.votes.map((vote) => ({
        ...vote,
        proposalId: BigNumber.from(vote.proposalId),
        weight: BigNumber.from(vote.weight),
      })),
      quorumNumerator: BigNumber.from(rawState.quorumNumerator),
    };
  },
};

const storages = [governanceTokenStorage];

export type Snapshot = {
  GovernanceToken: GovernanceTokenState;
};

export function parseStorage(rawValue: Record<string, any>): Snapshot {
  return {
    ...rawValue,
    ...(Object.fromEntries(
      storages.map((storage) => {
        return [
          storage.name,
          storage.decodeState(rawValue[storage.name].state),
        ];
      })
    ) as any),
  };
}

export async function initialSnapshot() {
  return {
    GovernanceToken: governanceTokenStorage.initialState(),
  };
}

function getOrCreateAccount(acc: GovernanceTokenState, address: string) {
  const existing = acc.accounts.get(address);
  if (existing) {
    return existing;
  }

  const newAccount: GovernanceAccount = {
    balance: ethers.BigNumber.from(0),
    delegatingTo: null,
    representing: [],
    represented: BigNumber.from(0),
  };

  acc.accounts.set(address, newAccount);

  return newAccount;
}

const governanceTokenContract = makeContractInstance({
  iface: GovernanceToken__factory.createInterface(),
  address: "0x4200000000000000000000000000000000000042",
  startingBlock: 0,
});

export const governanceTokenReducer: ReducerDefinition<
  GovernanceTokenInterface,
  GovernanceTokenState,
  GovernanceStateRaw
> = {
  ...governanceTokenStorage,
  ...governanceTokenContract,
  async dumpChangesToDynamo(dynamo, oldState, newState) {
    // only track additions
    const accountsToUpdate = Array.from(newState.accounts.entries()).flatMap(
      ([account, value]) => {
        const oldAccount = oldState.accounts.get(account);

        const encodedOldAccount = !oldAccount
          ? null
          : encodeAccountEntry([account, oldAccount]);

        const encodedNewAccount = encodeAccountEntry([account, value]);

        if (isEqual(encodedOldAccount, encodedNewAccount)) {
          return [];
        }

        return [
          {
            address: account,
            ...value,
          },
        ];
      }
    );

    const totalChunks = chunk(accountsToUpdate, 100);
    let idx = 0;
    for (const accounts of totalChunks) {
      console.log({ idx, total: totalChunks.length });
      await dynamo.transactWriteItems({
        TransactItems: accounts.map((account) => {
          return {
            Update: makeUpdateForAccount(account),
          };
        }),
      });
      idx++;
    }
  },
  eventHandlers: [
    {
      signature: "Transfer(address,address,uint256)",
      reduce(acc, event, log) {
        if (event.args.from === event.args.to) {
          return acc;
        }

        if (event.args.from === ethers.constants.AddressZero) {
          acc.totalSupply = acc.totalSupply.add(event.args.value);
        }

        if (event.args.to === ethers.constants.AddressZero) {
          acc.totalSupply = acc.totalSupply.sub(event.args.value);
        }

        const fromAccount = getOrCreateAccount(acc, event.args.from);
        const toAccount = getOrCreateAccount(acc, event.args.to);

        const amount = event.args.value;

        fromAccount.balance = fromAccount.balance.sub(amount);
        toAccount.balance = toAccount.balance.add(amount);

        return acc;
      },
    },
    {
      signature: "DelegateVotesChanged(address,uint256,uint256)",
      reduce(acc, event) {
        const account = getOrCreateAccount(acc, event.args.delegate);

        if (!event.args.previousBalance.eq(account.represented)) {
          throw new Error("unexpected previous balance");
        }

        account.represented = event.args.newBalance;

        acc.delegatedSupply = acc.delegatedSupply.add(
          event.args.newBalance.sub(event.args.previousBalance)
        );

        return acc;
      },
    },
    {
      signature: "DelegateChanged(address,address,address)",
      reduce(acc, event) {
        if (event.args.fromDelegate === event.args.toDelegate) {
          return acc;
        }

        const delegatorAccount = getOrCreateAccount(acc, event.args.delegator);

        if (
          (delegatorAccount.delegatingTo ?? ethers.constants.AddressZero) !==
          event.args.fromDelegate
        ) {
          throw new Error("mismatched from address");
        }

        delegatorAccount.delegatingTo = event.args.toDelegate;

        const fromAccount = getOrCreateAccount(acc, event.args.fromDelegate);

        const toAccounts = getOrCreateAccount(acc, event.args.toDelegate);

        fromAccount.representing = fromAccount.representing.filter(
          (it) => it !== event.args.delegator
        );

        toAccounts.representing = [
          ...toAccounts.representing,
          event.args.delegator,
        ];

        return acc;
      },
    },
  ],
};

export function makeReducers(): ReducerDefinition<any, any, any>[] {
  return [governanceTokenReducer];
}

type Signatures<InterfaceType extends TypedInterface> = {
  [K in keyof InterfaceType["events"] & string]: K;
}[keyof InterfaceType["events"] & string][];

type TypedEventFilter<
  InterfaceType extends TypedInterface,
  SignaturesType extends Signatures<InterfaceType>
> = {
  instance: ContractInstance<InterfaceType>;
  signatures: SignaturesType;
  filter: ethers.EventFilter;
};

export function typedEventFilter<
  InterfaceType extends TypedInterface,
  SignaturesType extends Signatures<InterfaceType>
>(
  instance: ContractInstance<InterfaceType>,
  signatures: SignaturesType
): TypedEventFilter<InterfaceType, SignaturesType> {
  return {
    instance,
    signatures,
    filter: filterForEventHandlers(instance, signatures),
  };
}

export type EventTypeForSignatures<
  InterfaceType extends TypedInterface,
  SignaturesType extends Signatures<InterfaceType>
> = {
  [K in SignaturesType[number]]: ethers.utils.LogDescription<
    K,
    EventFragmentArg<InterfaceType["events"][K]>
  >;
}[SignaturesType[number]];

export type TypedLogEvent<
  InterfaceType extends TypedInterface,
  SignaturesType extends Signatures<InterfaceType>
> = {
  log: ethers.providers.Log;
  event: EventTypeForSignatures<InterfaceType, SignaturesType>;
};

export async function getTypedLogs<
  InterfaceType extends TypedInterface,
  SignaturesType extends Signatures<InterfaceType>
>(
  provider: ethers.providers.Provider,
  eventFilter: TypedEventFilter<InterfaceType, SignaturesType>,
  latestBlockNumber: number,
  startBlock: number
): Promise<TypedLogEvent<InterfaceType, SignaturesType>[]> {
  let allLogs = [];

  for await (const logs of getAllLogs(
    provider,
    eventFilter.filter,
    latestBlockNumber,
    startBlock
  )) {
    allLogs.push(...logs);
  }

  return allLogs.map((log) => ({
    log,
    event: eventFilter.instance.iface.parseLog(log) as any,
  }));
}

export function filterForEventHandlers<InterfaceType extends TypedInterface>(
  instance: ContractInstance<InterfaceType>,
  signatures: Signatures<InterfaceType>
): ethers.EventFilter {
  return {
    address: instance.address,
    topics: [
      signatures.flatMap((signature) => {
        const fragment = ethers.utils.EventFragment.fromString(signature);
        return ethers.utils.Interface.getEventTopic(fragment);
      }),
    ],
  };
}

async function updateSnapshotForIndexers<Snapshot extends any>(
  sentry: ToucanInterface,
  provider: ethers.providers.Provider,
  snapshot: Snapshot
): Promise<Snapshot> {
  const reducers = makeReducers();
  // todo: this doesn't handle forks correctly
  const latestBlockNumber = await provider.getBlockNumber();

  for (const reducer of reducers) {
    const filter = filterForEventHandlers(
      reducer,
      reducer.eventHandlers.map((handler) => handler.signature)
    );
    const snapshotValue = snapshot[reducer.name];
    let state = (() => {
      if (snapshotValue) {
        return reducer.decodeState(snapshotValue.state);
      }

      return reducer.initialState();
    })();

    let idx = 0;
    for await (const logs of getAllLogs(
      provider,
      filter,
      latestBlockNumber,
      snapshotValue?.block ?? reducer.startingBlock
    )) {
      for (const log of logs) {
        await withSentryScope(sentry, async (scope) => {
          const event = reducer.iface.parseLog(log);
          const eventHandler = reducer.eventHandlers.find(
            (e) => e.signature === event.signature
          );

          try {
            state = await eventHandler.reduce(state, event, log);
          } catch (e) {
            scope.setExtras({
              event,
              log,
              logs: logs.length,
              idx,
            });
            sentry.captureException(e);
          }
          idx++;
        });
      }
    }

    snapshot[reducer.name] = {
      state: reducer.encodeState(state),
      block: latestBlockNumber,
    };
  }

  return snapshot;
}

export async function updateSnapshot<Snapshot extends any>(
  sentry: ToucanInterface,
  provider: ethers.providers.Provider,
  snapshot: Snapshot
): Promise<Snapshot> {
  const items = await Promise.allSettled([
    updateSnapshotForIndexers(sentry, provider, snapshot),
  ]);

  return items.reduce((acc, item) => {
    switch (item.status) {
      case "fulfilled":
        return {
          ...acc,
          ...(item.value as any),
        };

      case "rejected":
        sentry.captureException(item.reason);
        return {
          ...acc,
        };
    }
  }, {}) as Snapshot;
}
