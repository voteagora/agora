import { ethers } from "ethers";
import { AbiParametersToPrimitiveTypes } from "abitype";
import { encodeAbiParameters, encodeEventTopics } from "viem";

import { BlockIdentifier } from "./process/storageHandle";
import { FakeBlockProviderBlock } from "./blockProvider/fakeBlockProvider";
import {
  blockIdentifierFromBlock,
  BlockProviderBlock,
} from "./blockProvider/blockProvider";
import { AbiEvents, ContractInstance } from "./process/contractInstance";
import { BlockStorageArea, StorageArea } from "./process/followChain";
import { blockIdentifierKey } from "./storage/keys/keys";

export type BlockWithLog = {
  block: BlockIdentifier;
  logs: EncodeLogArgs<any, any>[];
};

export function appendBlocksWithLogs(
  initialBlock: BlockIdentifier,
  blocks: FakeBlockProviderBlock[],
  newBlocks: ReadonlyArray<ReadonlyArray<EncodeLogArgs<any, any>>>
) {
  const firstSequenceBlock = blocks.length
    ? blockIdentifierFromBlock(blocks[blocks.length - 1].block)
    : initialBlock;

  blocks.push(
    ...makeFakeBlocks(
      firstSequenceBlock,
      newBlocks.map<BlockWithLog>((logs, idx) => {
        return {
          block: makeBlockIdentifier(idx + firstSequenceBlock.blockNumber + 1),
          logs: logs.map((log) => makeEncodeLogArgs(log)),
        };
      })
    )
  );
}

export function makeFakeBlocks(
  parentBlock: BlockIdentifier,
  blocks: BlockWithLog[]
): FakeBlockProviderBlock[] {
  return blocks.map((block, idx, array) => {
    const parentHash = idx === 0 ? parentBlock.hash : array[idx - 1].block.hash;

    const blockProviderBlock: BlockProviderBlock = {
      hash: block.block.hash,
      number: block.block.blockNumber,
      parentHash,
    };

    return {
      block: blockProviderBlock,
      logs: block.logs.map((log) =>
        combineEncodedLogWithBlock(
          log.contractInstance,
          encodeLog(log),
          blockIdentifierFromBlock(blockProviderBlock)
        )
      ),
    };
  });
}

export function combineEncodedLogWithBlock(
  contractInstance: ContractInstance<any>,
  encodedLog: ReturnType<typeof encodeLog>,
  block: BlockIdentifier
): ethers.providers.Log {
  return {
    blockNumber: block.blockNumber,
    blockHash: block.hash,
    removed: false,
    address: contractInstance.address,

    ...encodedLog,

    transactionIndex: 0,
    transactionHash: "0x0",
    logIndex: 0,
  };
}

export type EncodeLogArgs<
  TAbiEvents extends AbiEvents,
  EventName extends keyof TAbiEvents & string
> = {
  contractInstance: ContractInstance<TAbiEvents>;
  eventName: EventName;
  values: AbiParametersToPrimitiveTypes<
    TAbiEvents[EventName]["inputs"],
    "inputs"
  >;
};

export function makeEncodeLogArgs<
  TAbiEvents extends AbiEvents,
  EventName extends keyof TAbiEvents & string
>(
  args: EncodeLogArgs<TAbiEvents, EventName>
): EncodeLogArgs<TAbiEvents, EventName> {
  return args;
}

export function encodeLog<
  TAbiEvents extends AbiEvents,
  EventName extends keyof TAbiEvents & string
>({
  values,
  contractInstance,
  eventName,
}: EncodeLogArgs<TAbiEvents, EventName>) {
  return {
    topics: encodeEventTopics({
      abi: Object.values(contractInstance.abiEvents),
      eventName,
      args: values as any,
    }),
    data: (() => {
      const eventFragment = contractInstance.abiEvents[eventName];
      const argsWithType = eventFragment.inputs.map((it, idx) => ({
        type: it,
        arg: values[idx],
      }));

      const dataArgs = argsWithType.flatMap((it) => {
        if (it.type.indexed) {
          return [];
        }

        return [it];
      });

      return encodeAbiParameters(
        dataArgs.map((it) => it.type),
        dataArgs.map((it) => it.arg)
      );
    })(),
  };
}

export function makeStorageEntryForLatestBlock(
  block: BlockIdentifier
): [string, BlockIdentifier] {
  return [blockIdentifierKey, block];
}

export function makeBlockIdentifier(number: number): BlockIdentifier {
  return {
    hash: `0x${number.toString(16)}`,
    blockNumber: number,
  };
}

/**
 * Makes a storage area from a list of block storage areas sorted from most
 * recent to least recent.
 */
export function makeStorageAreaFromBlockSequence(
  blockStorageAreas: BlockStorageArea[]
): StorageArea {
  const blocks = Array.from([...blockStorageAreas, null].reverse().entries())
    .reverse()
    .map(([idx, storageArea]) => {
      const blockIdentifier = makeBlockIdentifier(idx + 1);

      return {
        blockIdentifier,
        storageArea,
      };
    });

  const tipBlock = blocks[0];
  const finalizedBlock = blocks[blocks.length - 1];
  const parents = new Map(
    blocks.flatMap((it, idx, arr) => {
      const parentBlock = arr[idx + 1];
      if (!parentBlock) {
        return [];
      }

      return [[it.blockIdentifier.hash, parentBlock.blockIdentifier]];
    })
  );

  return {
    finalizedBlock: finalizedBlock.blockIdentifier,
    tipBlock: tipBlock.blockIdentifier,
    parents,
    blockStorageAreas: new Map(
      blocks.flatMap((block) => {
        if (!block.storageArea) {
          return [];
        }

        return [[block.blockIdentifier.hash, block.storageArea]];
      })
    ),
  };
}
