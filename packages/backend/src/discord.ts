import { nounsDao, nounsToken } from "./contracts";
import { getTypedLogs, typedEventFilter, TypedLogEvent } from "./snapshot";
import { groupBy } from "lodash";
import { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/v10";
import { resolveNameFromAddress } from "./utils/resolveName";
import { getTitleFromProposalDescription } from "./utils/markdown";
import { NNSENSReverseResolver } from "./contracts/generated";
import { ethers } from "ethers";

const nounTokenFilter = typedEventFilter(nounsToken, [
  "DelegateChanged(address,address,address)",
]);

const nounsDaoFilter = typedEventFilter(nounsDao, [
  "VoteCast(address,uint256,uint8,uint256,string)",
  "ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)",
]);

async function* blocksToMessages(
  provider: ethers.providers.Provider,
  resolver: NNSENSReverseResolver,
  blocks: GroupedBlock<
    TypedLogEvent<
      typeof nounTokenFilter["instance"]["iface"],
      typeof nounTokenFilter["signatures"]
    >,
    TypedLogEvent<
      typeof nounsDaoFilter["instance"]["iface"],
      typeof nounsDaoFilter["signatures"]
    >
  >[]
) {
  for (const block of blocks) {
    const blockMetadata = await provider.getBlock(block.blockHash);
    const blockTimestamp = new Date(blockMetadata.timestamp * 1000);

    for (const transaction of block.transactions) {
      for (const { log, event } of transaction.logs) {
        switch (event.signature) {
          case "DelegateChanged(address,address,address)": {
            const owner = await resolveNameFromAddress(
              event.args.delegator,
              resolver,
              provider
            );
            const oldDelegate = await resolveNameFromAddress(
              event.args.fromDelegate,
              resolver,
              provider
            );
            const newDelegate = await resolveNameFromAddress(
              event.args.toDelegate,
              resolver,
              provider
            );

            const resolvedDelegator = owner ?? event.args.delegator;
            const resolvedOldDelegate = oldDelegate ?? event.args.fromDelegate;
            const resolvedNewDelegate = newDelegate ?? event.args.toDelegate;

            const message: RESTPostAPIWebhookWithTokenJSONBody = {
              embeds: [
                {
                  title: "Delegate Changed",
                  description: `${resolvedDelegator} changed delegate from ${resolvedOldDelegate} to ${resolvedNewDelegate}`,
                  timestamp: blockTimestamp.toISOString(),
                  url: `https://etherscan.io/tx/${transaction.transactionHash}`,
                  fields: [
                    {
                      name: "Owner",
                      value: `[${resolvedDelegator}](https://nounsagora.com/delegate/${event.args.delegator})`,
                    },
                    {
                      name: "New Delegate",
                      value: `[${resolvedNewDelegate}](https://nounsagora.com/delegate/${event.args.toDelegate})`,
                    },
                    {
                      name: "Old Delegate",
                      value: `[${resolvedOldDelegate}](https://nounsagora.com/delegate/${event.args.fromDelegate})`,
                    },
                  ],
                },
              ],
            };

            yield message;
            break;
          }

          case "ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)": {
            const message: RESTPostAPIWebhookWithTokenJSONBody = {
              embeds: [
                {
                  title: `Proposal Created (#${event.args.id})`,
                  description: getTitleFromProposalDescription(
                    event.args.description
                  ),
                  timestamp: blockTimestamp.toISOString(),
                  url: `https://nouns.wtf/vote/${event.args.id}`,
                },
              ],
            };

            yield message;
            break;
          }

          case "VoteCast(address,uint256,uint8,uint256,string)": {
            if (event.args.votes.eq(0)) {
              continue;
            }

            const voter = await resolveNameFromAddress(
              event.args.voter,
              resolver,
              provider
            );

            const voterRef = voter ?? event.args.voter;

            // todo: add proposal title

            const message: RESTPostAPIWebhookWithTokenJSONBody = {
              embeds: [
                {
                  title: `${voterRef} voted ${toSupportType(
                    event.args.support
                  )} Prop #${
                    event.args.proposalId
                  } with ${event.args.votes.toString()} votes`,
                  description: event.args.reason,
                  timestamp: blockTimestamp.toISOString(),
                  fields: [
                    {
                      name: "Proposal",
                      value: `[Prop #${event.args.proposalId}](https://nouns.wtf/vote/${event.args.proposalId})`,
                    },
                    {
                      name: "Delegate Profile",
                      value: `[${voterRef}](https://nounsagora.com/delegate/${voterRef})`,
                    },
                    {
                      name: "Transaction",
                      value: `[${transaction.transactionHash}](https://etherscan.io/tx/${transaction.transactionHash})`,
                    },
                  ],
                },
              ],
            };

            yield message;
            break;
          }
        }
      }
    }
  }
}

function toSupportType(value: number): "FOR" | "AGAINST" | "ABSTAIN" {
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
export async function postDiscordMessagesSinceLastUpdate(
  provider: ethers.providers.Provider,
  resolver: NNSENSReverseResolver,
  startBlock: number,
  endBlock: number,
  webhookUrl: string
) {
  const [tokenLogs, daoLogs] = await Promise.all([
    getTypedLogs(provider, nounTokenFilter, endBlock, startBlock),
    getTypedLogs(provider, nounsDaoFilter, endBlock, startBlock),
  ]);

  const blocks = groupLogs(tokenLogs, daoLogs);

  for await (const message of blocksToMessages(provider, resolver, blocks)) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(message),
    });

    if (response.status >= 400) {
      throw new Error(
        `bad response: ${response.status} ${await response.text()}`
      );
    }
  }
}

function groupLogs<
  Lhs extends TypedLogEvent<any, any>,
  Rhs extends TypedLogEvent<any, any>
>(lhs: Lhs[], rhs: Rhs[]): GroupedBlock<Lhs, Rhs>[] {
  const logs = [...lhs, ...rhs];

  return Object.entries(groupBy(logs, ({ log }) => log.blockHash))
    .map(([blockHash, logs]) => ({
      blockHash,
      blockNumber: logs[0].log.blockNumber,

      transactions: Object.entries(
        groupBy(logs, ({ log }) => log.transactionHash)
      )
        .map(([transactionHash, logs]) => ({
          transactionHash,
          transactionIndex: logs[0].log.transactionIndex,
          logs: logs.sort(
            ({ log: { logIndex: a } }, { log: { logIndex: b } }) => a - b
          ),
        }))
        .sort(({ transactionIndex: a }, { transactionIndex: b }) => a - b),
    }))
    .sort(({ blockNumber: a }, { blockNumber: b }) => a - b);
}

type GroupedBlock<
  Lhs extends TypedLogEvent<any, any>,
  Rhs extends TypedLogEvent<any, any>
> = {
  blockHash: string;
  blockNumber: number;
  transactions: {
    transactionHash: string;
    transactionIndex: number;
    logs: (Lhs | Rhs)[];
  }[];
};

// todo: standardize formatters
