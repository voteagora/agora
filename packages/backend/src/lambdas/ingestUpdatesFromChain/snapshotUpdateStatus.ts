import {
  UpdateExpression,
  ExpressionAttributes,
} from "@aws/dynamodb-expressions";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  makeKey,
  marshaller,
  setFields,
  TableName,
  withAttributes,
} from "../../store/dynamo/utils";

export async function updateSnapshotUpdateStatus(
  latestBlockSynced: number,
  dynamo: DynamoDB
) {
  const attributes = new ExpressionAttributes();
  await dynamo.updateItem({
    TableName,
    Key: snapshotUpdateStatusKey,
    UpdateExpression: (() => {
      const updateExpression = new UpdateExpression();

      setFields(updateExpression, {
        latestBlockSynced,
      });

      return updateExpression.serialize(attributes);
    })(),
    ...withAttributes(attributes),
  });
}

const snapshotUpdateStatusKey = makeKey({
  PartitionKey: "SnapshotUpdateStatus",
  SortKey: "",
});

export async function fetchSnapshotUpdateStatus(
  dynamo: DynamoDB
): Promise<{ latestBlockSynced: number } | null> {
  const result = await dynamo.getItem({
    TableName,
    Key: snapshotUpdateStatusKey,
    ConsistentRead: true,
  });

  if (!result.Item) {
    return null;
  }

  return marshaller.unmarshallItem(result.Item);
}
