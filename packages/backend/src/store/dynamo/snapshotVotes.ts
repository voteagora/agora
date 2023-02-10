import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { SnapshotVote, SnapshotVoteStorage } from "../../model";
import { marshaller, TableName, withAttributes } from "./utils";
import {
  equals,
  ExpressionAttributes,
  serializeConditionExpression,
} from "@aws/dynamodb-expressions";

export function makeSnapshotVoteStorage(dynamo: DynamoDB): SnapshotVoteStorage {
  return {
    async getSnapshotVotesByVoter(address: string): Promise<SnapshotVote[]> {
      const expressionAttributes = new ExpressionAttributes();
      const result = await dynamo.query({
        TableName,
        KeyConditionExpression: serializeConditionExpression(
          {
            subject: "PartitionKey",
            ...equals(`SnapshotVote#${address.toLowerCase()}`),
          },
          expressionAttributes
        ),
        ...withAttributes(expressionAttributes),
      });

      return result.Items.map((it) => marshaller.unmarshallItem(it)).flatMap(
        (it) => {
          if (!it.proposal) {
            return [];
          }

          return [it];
        }
      ) as any;
    },
  };
}
