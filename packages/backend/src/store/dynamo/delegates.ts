import {
  DelegateOverview,
  DelegatesPage,
  DelegateStorage,
  GetDelegatesParams,
  StoredStatement,
} from "../../model";
import { DynamoDB, Update } from "@aws-sdk/client-dynamodb";
import {
  ConditionExpression,
  attributeExists,
  serializeConditionExpression,
  ExpressionAttributes,
  equals,
  attributeNotExists,
} from "@aws/dynamodb-expressions";
import { BigNumber } from "ethers";
import {
  makeKey,
  marshaller,
  PartitionKey__MergedDelegatesStatementHolders,
  PartitionKey__MergedDelegatesVotingPower,
  setFields,
  TableName,
  updateExpression,
  withAttributes,
} from "./utils";
import { ENSAccount } from "../../snapshot";

function loadDelegateOverview(item: any): DelegateOverview {
  return {
    address: item.address as string,
    tokensOwned: BigNumber.from(item.tokensOwned),
    tokensRepresented: BigNumber.from(item.tokensRepresented),
    tokenHoldersRepresented: item.tokenHoldersRepresented as number,
    resolvedName: item.resolvedName as string | null,
    statement: item.statement as StoredStatement,
  };
}

export function makeMergedDelegateKey(address: string) {
  return makeKey({
    PartitionKey: "MergedDelegate",
    SortKey: address.toLowerCase(),
  });
}

export function makeDynamoDelegateStore(client: DynamoDB): DelegateStorage {
  return {
    async getDelegate(address: string): Promise<DelegateOverview> {
      const result = await client.getItem({
        TableName,
        Key: makeMergedDelegateKey(address),
      });

      if (!result.Item) {
        return null;
      }

      return loadDelegateOverview(marshaller.unmarshallItem(result.Item));
    },

    async getDelegates({
      first,
      after,
      orderBy,
      where,
    }: GetDelegatesParams): Promise<DelegatesPage> {
      const expressionAttributes = new ExpressionAttributes();

      const result = await client.query({
        TableName,
        ...(() => {
          if (!where) {
            return {};
          }

          switch (where) {
            case "withStatement":
            case "withoutStatement":
              const filterExpression: ConditionExpression = {
                subject: "statement",
                ...(() => {
                  if (where === "withStatement") {
                    return attributeExists();
                  } else {
                    return attributeNotExists();
                  }
                })(),
              };

              return {
                FilterExpression: serializeConditionExpression(
                  filterExpression,
                  expressionAttributes
                ),
              };

            default:
              return {};
          }
        })(),
        ...(() => {
          switch (orderBy) {
            case "mostVotingPower": {
              return {
                KeyConditionExpression: serializeConditionExpression(
                  {
                    subject: "PartitionKey__MergedDelegatesVotingPower",
                    ...equals(PartitionKey__MergedDelegatesVotingPower),
                  },
                  expressionAttributes
                ),
                IndexName: "MergedDelegatesVotingPower",
                ScanIndexForward: false,
              };
            }

            case "mostDelegates":
              return {
                KeyConditionExpression: serializeConditionExpression(
                  {
                    subject: "PartitionKey__MergedDelegatesStatementHolders",
                    ...equals(PartitionKey__MergedDelegatesStatementHolders),
                  },
                  expressionAttributes
                ),
                IndexName: "MergedDelegatesStatementHolders",
                ScanIndexForward: false,
              };
          }
        })(),
        ...(() => {
          if (!after) {
            return;
          }

          return {
            ExclusiveStartKey: JSON.parse(after),
          };
        })(),
        ...withAttributes(expressionAttributes),
        Limit: first,
      });

      const edges = result.Items.map((rawItem, idx, list) => {
        const item = marshaller.unmarshallItem(rawItem);

        return {
          node: loadDelegateOverview(item),
          cursor:
            list.length - 1 === idx
              ? JSON.stringify(result.LastEvaluatedKey)
              : JSON.stringify(makeKey(item as any)),
        };
      });

      const endCursor =
        edges[edges.length - 1]?.cursor ??
        JSON.stringify(result.LastEvaluatedKey);

      return {
        edges,
        pageInfo: {
          endCursor,
          hasNextPage: !!endCursor,

          hasPreviousPage: true,
          startCursor: "empty",
        } as any,
      };
    },
  };
}

export function makeUpdateForAccount(
  account: ENSAccount & { address: string }
): Update {
  return {
    TableName,
    Key: makeMergedDelegateKey(account.address),

    ...updateExpression((exp) =>
      setFields(exp, {
        PartitionKey__MergedDelegatesVotingPower,
        SortKey__MergedDelegatesVotingPower: account.represented
          .toHexString()
          .replace("0x", "")
          .toLowerCase()
          .padStart(256 / 4, "0"),
        PartitionKey__MergedDelegatesStatementHolders,
        SortKey__MergedDelegatesStatementHolders: account.representing.length
          .toString()
          .padStart(10, "0"),
        address: account.address.toLowerCase(),
        tokensOwned: account.balance.toString(),
        tokensRepresented: account.represented.toString(),
        tokenHoldersRepresented: account.representing.length,
      })
    ),
  };
}
