import { ethers } from "ethers";
import { ENSGovernor__factory, ENSToken__factory } from "./contracts/generated";
import { ENSGovernorInterface } from "./contracts/generated/ENSGovernor";
import { ENSTokenInterface } from "./contracts/generated/ENSToken";
import { BigNumber } from "ethers";

interface TypedInterface extends ethers.utils.Interface {
  events: Record<string, ethers.utils.EventFragment<Record<string, any>>>;
}

type ReducerDefinition<
  InterfaceType extends TypedInterface,
  Accumulator,
  RawState
> = {
  iface: InterfaceType;
  address: string;
  startingBlock: number;
  eventHandlers: EventHandler<InterfaceType, Accumulator>[];
} & StorageDefinition<Accumulator, RawState>;

type StorageDefinition<State, RawState> = {
  name: string;
  initialState: () => State;
  decodeState: (rawState: RawState) => State;
  encodeState: (state: State) => RawState;
};

// @ts-ignore
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
}[keyof InterfaceType["events"]];

type EventFragmentArg<T> = T extends ethers.utils.EventFragment<infer Args>
  ? Args
  : never;

export type ENSTokenState = {
  accounts: Map<string, ENSAccount>;

  totalSupply: BigNumber;
  delegatedSupply: BigNumber;
};

export type ENSAccount = {
  balance: BigNumber;
  delegatingTo: string | null;

  represented: BigNumber;
  representing: string[];
};

type ENSTokenStateRaw = {
  accounts: [
    string,
    {
      balance: string;
      delegatingTo: string | null;
      representing: string[];
      represented: string;
    }
  ][];

  totalSupply: string;
  delegatedSupply: string;
};

const tokensStorage: StorageDefinition<ENSTokenState, ENSTokenStateRaw> = {
  name: "ENSToken",
  initialState: () => ({
    accounts: new Map<string, ENSAccount>(),
    totalSupply: BigNumber.from(0),
    delegatedSupply: BigNumber.from(0),
  }),
  encodeState(acc) {
    return {
      accounts: Array.from(acc.accounts.entries())
        .sort(([, a], [, b]) => (a.represented.gt(b.represented) ? -1 : 1))
        .map(([key, value]) => [
          key,
          {
            ...value,
            balance: value.balance.toString(),
            represented: value.represented.toString(),
          },
        ]),

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
            delegatingTo: null,
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

type Proposal = {
  id: string;
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

  votes: Vote[];
};

type Vote = {
  voter: string;
  support: number;
  weight: BigNumber;
  reason: string;
};

type GovernorState = {
  proposals: Map<string, Proposal>;
  quorumNumerator: BigNumber;
};

const governorStorage: StorageDefinition<GovernorState, any> = {
  name: "ENSGovernor",

  initialState() {
    return {
      proposals: new Map(),
      quorumNumerator: BigNumber.from(0),
    };
  },

  encodeState(state) {
    return {
      proposals: Array.from(state.proposals.entries()),
      quorumNumerator: state.quorumNumerator.toString(),
    };
  },

  decodeState() {
    return {} as any;
    // throw new Error();
  },
};

const storages = [tokensStorage, governorStorage];

export type Snapshot = {
  ENSGovernor: GovernorState;
  ENSToken: ENSTokenState;
};

export function parseStorage(rawValue: Record<string, any>): Snapshot {
  return Object.fromEntries(
    storages.map((storage) => {
      return [storage.name, storage.decodeState(rawValue[storage.name].state)];
    })
  ) as any;
}

export function makeReducers(): ReducerDefinition<any, any, any>[] {
  function getOrCreateAccount(acc: ENSTokenState, address: string) {
    const existing = acc.accounts.get(address);
    if (existing) {
      return existing;
    }

    const newAccount: ENSAccount = {
      balance: ethers.BigNumber.from(0),
      delegatingTo: null,
      representing: [],
      represented: BigNumber.from(0),
    };

    acc.accounts.set(address, newAccount);

    return newAccount;
  }

  const tokensReducer: ReducerDefinition<
    ENSTokenInterface,
    ENSTokenState,
    ENSTokenStateRaw
  > = {
    ...tokensStorage,
    iface: ENSToken__factory.createInterface(),
    address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
    startingBlock: 13533418,
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

          const delegatorAccount = getOrCreateAccount(
            acc,
            event.args.delegator
          );

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

  const governorReducer: ReducerDefinition<
    ENSGovernorInterface,
    GovernorState,
    any
  > = {
    ...governorStorage,
    address: "0x323A76393544d5ecca80cd6ef2A560C6a395b7E3",
    startingBlock: 13533772,
    iface: ENSGovernor__factory.createInterface(),

    eventHandlers: [
      {
        signature:
          "ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)",

        reduce(acc, event) {
          acc.proposals.set(event.args.proposalId.toString(), {
            id: event.args.proposalId.toString(),
            proposer: event.args.proposer,
            startBlock: event.args.startBlock,
            endBlock: event.args.endBlock,
            description: event.args.description,

            targets: event.args.targets,
            values: event.args[3],
            signatures: event.args.signatures,
            calldatas: event.args.calldatas,

            status: { type: "CREATED" },

            votes: [],
          });

          return acc;
        },
      },
      {
        signature: "QuorumNumeratorUpdated(uint256,uint256)",
        reduce(acc, event) {
          acc.quorumNumerator = event.args.newQuorumNumerator;
          return acc;
        },
      },
      {
        signature: "VoteCast(address,uint256,uint8,uint256,string)",
        reduce(acc, event) {
          const proposal = acc.proposals.get(event.args.proposalId.toString());

          proposal.votes.push({
            voter: event.args.voter,
            support: event.args.support,
            weight: event.args.weight,
            reason: event.args.reason,
          });

          return acc;
        },
      },
      {
        signature: "ProposalCanceled(uint256)",
        reduce(acc, event) {
          acc.proposals.get(event.args.proposalId.toString()).status = {
            type: "CANCELLED",
          };

          return acc;
        },
      },
      {
        signature: "ProposalExecuted(uint256)",
        reduce(acc, event) {
          acc.proposals.get(event.args.proposalId.toString()).status = {
            type: "EXECUTED",
          };

          return acc;
        },
      },
      {
        signature: "ProposalQueued(uint256,uint256)",
        reduce(acc, event) {
          acc.proposals.get(event.args.proposalId.toString()).status = {
            type: "QUEUED",
            activatedAt: event.args.eta,
          };

          return acc;
        },
      },
    ],
  };

  return [tokensReducer, governorReducer];
}

export function filterForEventHandlers(
  reducer: ReducerDefinition<any, any, any>
): ethers.EventFilter {
  return {
    address: reducer.address,
    topics: [
      reducer.eventHandlers.flatMap((handler) => {
        const fragment = ethers.utils.EventFragment.fromString(
          handler.signature
        );

        return ethers.utils.Interface.getEventTopic(fragment);
      }),
    ],
  };
}
