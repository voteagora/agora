import { Update } from "@aws-sdk/client-dynamodb";
import { ExpressionAttributes } from "@aws/dynamodb-expressions";
import { Marshaller } from "@aws/dynamodb-auto-marshaller";

export const TableName = "ApplicationData";

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
    ExpressionAttributeValues: attributes.values as any,
  };
}
