import { Update } from "@aws-sdk/client-dynamodb";
import {
  AttributeValue,
  ExpressionAttributes,
  UpdateExpression,
} from "@aws/dynamodb-expressions";

import { Marshaller } from "@aws/dynamodb-auto-marshaller";

export const TableName = "ApplicationData";

export const PartitionKey__MergedDelegatesVotingPower = "fixed";
export const PartitionKey__MergedDelegatesStatementHolders = "fixed";

type KeyArgs = {
  PartitionKey: string;
  SortKey: string;
};

export const marshaller = new Marshaller({ unwrapNumbers: true });

export function makeKey(args: KeyArgs) {
  return marshaller.marshallItem({
    PartitionKey: args.PartitionKey,
    SortKey: args.SortKey,
  });
}

type AttributeFields = Pick<
  Update,
  "ExpressionAttributeNames" | "ExpressionAttributeValues"
>;

export function withAttributes(
  attributes: ExpressionAttributes
): AttributeFields {
  return {
    ExpressionAttributeNames: attributes.names,
    ExpressionAttributeValues: attributes.values,
  };
}

export function setFields(updateExpression: UpdateExpression, fields: Object) {
  for (const [key, value] of Object.entries(fields)) {
    updateExpression.set(
      key,
      new AttributeValue(marshaller.marshallValue(value))
    );
  }
}
