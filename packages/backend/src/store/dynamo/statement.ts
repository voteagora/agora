import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  UpdateExpression,
  AttributeValue,
  ExpressionAttributes,
} from "@aws/dynamodb-expressions";

import { StatementStorage, StoredStatement } from "../../model";
import {
  makeKey,
  marshaller,
  PartitionKey__MergedDelegatesStatementHolders,
  setFields,
  TableName,
  withAttributes,
} from "./utils";

export function makeDelegateStatementKey(address: string) {
  return makeKey({
    PartitionKey: `DelegateStatement`,
    SortKey: address,
  });
}

export function makeDynamoStatementStorage(client: DynamoDB): StatementStorage {
  return {
    async getStatement(address: string): Promise<StoredStatement | null> {
      const result = await client.getItem({
        TableName,
        Key: makeDelegateStatementKey(address.toLowerCase()),
      });

      return marshaller.unmarshallItem(result.Item) as any;
    },
    async addStatement(statement: StoredStatement): Promise<void> {
      const marshalledStatement = marshaller.marshallItem({
        ...statement,
      });

      await client.transactWriteItems({
        TransactItems: [
          {
            Put: {
              TableName,
              Item: {
                ...makeDelegateStatementKey(statement.address.toLowerCase()),
                ...marshalledStatement,
              },
            },
          },
          {
            Update: {
              Key: makeKey({
                PartitionKey: `MergedDelegate`,
                SortKey: statement.address.toLowerCase(),
              }),
              TableName,

              ...(() => {
                const attributes = new ExpressionAttributes();

                const updateExpression = new UpdateExpression();
                updateExpression.set(
                  "statement",
                  new AttributeValue(marshalledStatement)
                );

                setFields(updateExpression, {
                  address: statement.address.toLowerCase(),
                  PartitionKey__MergedDelegatesStatementHolders,
                  SortKey__MergedDelegatesStatementHolders: 1,
                });

                return {
                  UpdateExpression: updateExpression.serialize(attributes),
                  ...withAttributes(attributes),
                };
              })(),
            },
          },
        ],
      });
    },
  };
}
