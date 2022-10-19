import { ethers } from "ethers";
import { ENSToken__factory } from "./contracts/generated";
import { ENSTokenInterface } from "./contracts/generated/ENSToken";

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
};

export type ENSAccount = {
  balance: ethers.BigNumber;
  delegatingTo: string | null;
  representing: string[];
};

type ENSTokenStateRaw = {
  accounts: [
    string,
    { balance: string; delegatingTo: string | null; representing: string[] }
  ][];
};

const tokensStorage: StorageDefinition<ENSTokenState, ENSTokenStateRaw> = {
  name: "ENSToken",
  initialState: () => ({ accounts: new Map<string, ENSAccount>() }),
  encodeState(acc) {
    return {
      accounts: Array.from(acc.accounts.entries()).map(([key, value]) => [
        key,
        {
          ...value,
          balance: value.balance.toString(),
        },
      ]),
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
          },
        ])
      ),
    };
  },
};

const storages = [tokensStorage];

export type Snapshot = {
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

    const newAccount = {
      balance: ethers.BigNumber.from(0),
      delegatingTo: null,
      representing: [],
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

          const fromAccount = getOrCreateAccount(acc, event.args.from);
          const toAccount = getOrCreateAccount(acc, event.args.to);

          const amount = event.args.value;

          fromAccount.balance = fromAccount.balance.sub(amount);
          toAccount.balance = toAccount.balance.add(amount);

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

  return [tokensReducer];
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
