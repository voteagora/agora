import {
  DelegateOverview,
  DelegatesPage,
  DelegateStorage,
  GetDelegatesParams,
  StoredStatement,
} from "../../model";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  ConditionExpression,
  attributeExists,
  serializeConditionExpression,
  ExpressionAttributes,
  equals,
} from "@aws/dynamodb-expressions";
import { BigNumber } from "ethers";
import {
  makeKey,
  marshaller,
  PartitionKey__MergedDelegatesVotingPower,
  TableName,
  withAttributes,
} from "./utils";

function loadDelegateOverview(item: any): DelegateOverview {
  return {
    address: item.address as string,
    tokensOwned: BigNumber.from(item.tokensOwned),
    tokensRepresented: BigNumber.from(item.tokensRepresented),
    tokenHoldersRepresented: item.tokenHoldersRepresented as number,
    statement: item.statement as StoredStatement,
  };
}

export function makeDynamoDelegateStore(client: DynamoDB): DelegateStorage {
  return {
    async getDelegate(address: string): Promise<DelegateOverview> {
      const result = await client.getItem({
        TableName,
        Key: makeKey({
          PartitionKey: `MergedDelegate`,
          SortKey: address.toString(),
        }),
      });

      return loadDelegateOverview(marshaller.unmarshallItem(result.Item));
    },

    async getDelegates({
      first,
      after,
      orderBy,
      where,
    }: GetDelegatesParams): Promise<DelegatesPage> {
      const result = await client.query({
        TableName,
        ...(() => {
          if (!where) {
            return {};
          }

          switch (where) {
            case "withStatement":
              const filterExpression: ConditionExpression = {
                subject: "delegateStatement",
                ...attributeExists(),
              };

              const expressionAttributes = new ExpressionAttributes();

              return {
                FilterExpression: serializeConditionExpression(
                  filterExpression,
                  expressionAttributes
                ),
                ...withAttributes(expressionAttributes),
              };

            case "seekingDelegation":
            // todo: implement

            default:
              return {};
          }
        })(),
        ...(() => {
          switch (orderBy) {
            // todo: separate these
            case "mostRelevant":
            case "mostVotingPower": {
              const expressionAttributes = new ExpressionAttributes();

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
                ...withAttributes(expressionAttributes),
              };
            }

            case "mostDelegates":
              return {
                IndexName: "MergedDelegatesStatementHolders",
                ScanIndexForward: false,
              };

            case "mostActive":
              // todo: implement
              return {};
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
        Limit: first,
      });

      return {
        edges: result.Items.map((rawItem, idx, list) => {
          const item = marshaller.unmarshallItem(rawItem);

          return {
            node: loadDelegateOverview(item),
            cursor:
              list.length - 1 === idx
                ? JSON.stringify(result.LastEvaluatedKey)
                : JSON.stringify(makeKey(item as any)),
          };
        }),
        pageInfo: {
          endCursor: result.LastEvaluatedKey
            ? JSON.stringify(result.LastEvaluatedKey)
            : null,
          hasNextPage: !!result.LastEvaluatedKey,

          hasPreviousPage: true,
          startCursor: "empty",
        },
      };
    },
  };
}
