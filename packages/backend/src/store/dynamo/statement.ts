import { DynamoDB } from "@aws-sdk/client-dynamodb";
import DataLoader from "dataloader";

import { StatementStorage, StoredStatement } from "../../schema/model";

import { makeKey, marshaller, TableName } from "./utils";

export function makeDelegateStatementKey(address: string) {
  return makeKey({
    PartitionKey: `DelegateStatement`,
    SortKey: address,
  });
}

export function makeDynamoStatementStorage(client: DynamoDB): StatementStorage {
  const getStatementDataloader = new DataLoader<string, StoredStatement | null>(
    async (keys) => {
      const results = await client.batchGetItem({
        RequestItems: {
          [TableName]: {
            Keys: keys.map((address) =>
              makeDelegateStatementKey(address)
            ) as any,
          },
        },
      });

      const statements = new Map(
        Object.values(results.Responses![TableName])
          .map((value) => marshaller.unmarshallItem(value) as StoredStatement)
          .map((statement) => {
            return [statement.address.toLowerCase(), statement];
          })
      );

      const values = keys.map((key) => {
        const normalizedKey = key.toLowerCase();
        return statements.get(normalizedKey) ?? null;
      });

      return values;
    },
    { batch: true, maxBatchSize: 100 }
  );

  return {
    async getStatement(address: string): Promise<StoredStatement | null> {
      const statement = await getStatementDataloader.load(
        address.toLowerCase()
      );
      return statement;
    },
    async addStatement(statement: StoredStatement): Promise<void> {
      const marshalledStatement = marshaller.marshallItem({
        ...statement,
      });

      await client.putItem({
        TableName,
        Item: {
          ...makeDelegateStatementKey(statement.address.toLowerCase()),
          ...marshalledStatement,
        } as any,
      });
    },
  };
}
