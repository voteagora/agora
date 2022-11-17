import { ethers } from "ethers";
import { NNSENSReverseResolver } from "./contracts/generated";
import { NounsDAOLogicV1Interface } from "./contracts/generated/NounsDAOLogicV1";
import { NounsTokenInterface } from "./contracts/generated/NounsToken";
import { resolveNameFromAddress } from "./utils/resolveName";
import { ToucanInterface, withSentryScope } from "./sentry";
import { getAllLogs } from "./events";
import { fetchAuctions, fetchAuctionsResponse } from "./propHouse";
import { z } from "zod";
import { ContractInstance, nounsDao, nounsToken, TypedInterface } from "./contracts";

type ReducerDefinition<
  InterfaceType extends TypedInterface,
  Accumulator,
  RawState
> = ContractInstance<InterfaceType> & {
  eventHandlers: EventHandler<InterfaceType, Accumulator>[];
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

export type DaoLogicState = {
  proposalBps: ethers.BigNumber;
  quorumBps: ethers.BigNumber;
  voteBlockTimestamp: Map<number, number>;
};

export type NounsTokenState = {
  addressToEnsName: Map<string, string | null>;
};

type NounsTokenStateRaw = {
  addressesToEnsName: [string, string | null][];
};

const tokensStorage: StorageDefinition<NounsTokenState, NounsTokenStateRaw> = {
  name: "NounsToken",
  initialState: () => ({ addressToEnsName: new Map() }),
  encodeState(acc) {
    return {
      addressesToEnsName: Array.from(acc.addressToEnsName.entries()),
    };
  },
  decodeState(state) {
    return {
      addressToEnsName: new Map(state.addressesToEnsName),
    };
  },
};

const daoLogicStorage: StorageDefinition<DaoLogicState, DaoLogicRawState> = {
  name: "NounsDAOLogicV1",
  initialState: () => ({
    proposalBps: ethers.BigNumber.from(0),
    quorumBps: ethers.BigNumber.from(0),
    voteBlockTimestamp: new Map<number, number>(),
  }),
  decodeState(rawState) {
    return {
      proposalBps: ethers.BigNumber.from(rawState.proposalBps),
      quorumBps: ethers.BigNumber.from(rawState.quorumBps),
      voteBlockTimestamp: new Map(rawState.voteBlockTimestamp),
    };
  },
  encodeState(state) {
    return {
      proposalBps: state.proposalBps.toString(),
      quorumBps: state.quorumBps.toString(),
      voteBlockTimestamp: Array.from(state.voteBlockTimestamp.entries()),
    };
  },
};

type DaoLogicRawState = {
  proposalBps: string;
  quorumBps: string;
  voteBlockTimestamp: [number, number][];
};

const storages = [daoLogicStorage, tokensStorage];

export type Snapshot = {
  NounsToken: NounsTokenState;
  NounsDAOLogicV1: DaoLogicState;
  PropHouse: {
    auctions: z.infer<typeof fetchAuctionsResponse>;
  };
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

export function makeReducers(
  provider: ethers.providers.Provider,
  resolver: NNSENSReverseResolver
): ReducerDefinition<any, any, any>[] {
  async function reduceAddress(
    address: string,
    acc: NounsTokenState
  ): Promise<NounsTokenState> {
    const normalizedAddress = address.toLowerCase();
    if (acc.addressToEnsName.has(normalizedAddress)) {
      return acc;
    }

    const resolvedName = await resolveNameFromAddress(
      normalizedAddress,
      resolver,
      provider
    );

    return {
      ...acc,
      addressToEnsName: new Map([
        ...acc.addressToEnsName.entries(),
        [normalizedAddress, resolvedName],
      ]),
    };
  }

  async function reduceAddresses(
    addresses: string[],
    acc: NounsTokenState
  ): Promise<NounsTokenState> {
    return await addresses.reduce(async (acc, address) => {
      return await reduceAddress(address, await acc);
    }, Promise.resolve(acc));
  }

  const daoLogicReducer: ReducerDefinition<
    NounsDAOLogicV1Interface,
    DaoLogicState,
    DaoLogicRawState
  > = {
    ...daoLogicStorage,
    ...nounsDao,
    eventHandlers: [
      {
        signature: "ProposalThresholdBPSSet(uint256,uint256)",
        reduce(acc, event) {
          return {
            ...acc,
            proposalBps: event.args.newProposalThresholdBPS,
          };
        },
      },
      {
        signature: "QuorumVotesBPSSet(uint256,uint256)",
        reduce(acc, event) {
          return {
            ...acc,
            quorumBps: event.args.newQuorumVotesBPS,
          };
        },
      },
      {
        signature: "VoteCast(address,uint256,uint8,uint256,string)",
        async reduce(acc, event, log) {
          const block = await provider.getBlock(log.blockHash);
          return {
            ...acc,
            voteBlockTimestamp: new Map([
              ...Array.from(acc.voteBlockTimestamp.entries()),
              [block.number, block.timestamp],
            ]),
          };
        },
      },
    ],
  };

  const tokensReducer: ReducerDefinition<
    NounsTokenInterface,
    NounsTokenState,
    NounsTokenStateRaw
  > = {
    ...tokensStorage,
    ...nounsToken,
    eventHandlers: [
      {
        signature: "Transfer(address,address,uint256)",
        async reduce(acc, event) {
          return await reduceAddresses([event.args.from, event.args.to], acc);
        },
      },
      {
        signature: "DelegateChanged(address,address,address)",
        async reduce(acc, event) {
          return await reduceAddresses(
            [
              event.args.fromDelegate,
              event.args.toDelegate,
              event.args.delegator,
            ],
            acc
          );
        },
      },
    ],
  };

  return [tokensReducer, daoLogicReducer];
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
  const { logs } = await getAllLogs(
    provider,
    eventFilter.filter,
    latestBlockNumber,
    startBlock
  );

  return logs.map((log) => ({
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
  resolver: NNSENSReverseResolver,
  snapshot: Snapshot
): Promise<Snapshot> {
  const reducers = makeReducers(provider, resolver);
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

    const { logs, latestBlockFetched } = await getAllLogs(
      provider,
      filter,
      latestBlockNumber,
      snapshotValue?.block ?? reducer.startingBlock
    );

    let idx = 0;
    for (const log of logs) {
      console.log({ idx, logs: logs.length });
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

    snapshot[reducer.name] = {
      state: reducer.encodeState(state),
      block: latestBlockFetched,
    };
  }

  return snapshot;
}

async function updateSnapshotForPropHouse() {
  return {
    PropHouse: {
      auctions: await fetchAuctions({ communityId: 1 }),
    },
  };
}

export async function updateSnapshot<Snapshot extends any>(
  sentry: ToucanInterface,
  provider: ethers.providers.Provider,
  resolver: NNSENSReverseResolver,
  snapshot: Snapshot
): Promise<Snapshot> {
  const items = await Promise.allSettled([
    updateSnapshotForIndexers(sentry, provider, resolver, snapshot),
    updateSnapshotForPropHouse(),
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
