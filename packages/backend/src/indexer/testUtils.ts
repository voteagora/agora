import { BlockIdentifier } from "./storageHandle";
import { FakeBlockProviderBlock } from "./blockProvider/fakeBlockProvider";
import {
  blockIdentifierFromBlock,
  BlockProviderBlock,
} from "./blockProvider/blockProvider";
import { ContractInstance, TypedInterface } from "../contracts";
import { ethers } from "ethers";
import { blockIdentifierKey } from "./storage/entityStore";

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
  InterfaceType extends TypedInterface,
  EventSignature extends keyof InterfaceType["events"] & string
> = {
  contractInstance: ContractInstance<InterfaceType>;
  signature: EventSignature;
  values: any[];
};

export function makeEncodeLogArgs<
  InterfaceType extends TypedInterface,
  EventSignature extends keyof InterfaceType["events"] & string
>(
  args: EncodeLogArgs<InterfaceType, EventSignature>
): EncodeLogArgs<InterfaceType, EventSignature> {
  return args;
}

export function encodeLog<
  InterfaceType extends TypedInterface,
  EventSignature extends keyof InterfaceType["events"] & string
>({
  values,
  contractInstance,
  signature,
}: EncodeLogArgs<InterfaceType, EventSignature>) {
  const eventFragment = contractInstance.iface.events[signature];

  return contractInstance.iface.encodeEventLog(eventFragment, values);
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
