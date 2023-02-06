import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshaller, TableName, withAttributes } from "./utils";
import {
  equals,
  ExpressionAttributes,
  serializeConditionExpression,
} from "@aws/dynamodb-expressions";
import { SnapshotVoteStorage } from "../../schema/context";
import { SnapshotVoteModel } from "../../schema/resolvers/snapshot";

export function makeSnapshotVoteStorage(dynamo: DynamoDB): SnapshotVoteStorage {
  return {
    async getSnapshotVotesByVoter(
      address: string
    ): Promise<SnapshotVoteModel[]> {
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

      return (result.Items ?? [])
        .map((it) => marshaller.unmarshallItem(it))
        .filter((it) => !!it.proposal) as any;
    },
  };
}
