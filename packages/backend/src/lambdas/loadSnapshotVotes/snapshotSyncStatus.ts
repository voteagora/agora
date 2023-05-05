import {
  UpdateExpression,
  ExpressionAttributes,
} from "@aws/dynamodb-expressions";
import {
  AttributeValue,
  DynamoDB,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  makeKey,
  marshaller,
  setFields,
  TableName,
  withAttributes,
} from "../../store/dynamo/utils";

export async function updateSnapshotSyncStatus(
  latestTSSynced: number,
  dynamo: DynamoDB
) {
  const attributes = new ExpressionAttributes();
  await dynamo.updateItem({
    TableName,
    Key: snapshotUpdateStatusKey as Record<string, AttributeValue>,
    UpdateExpression: (() => {
      const updateExpression = new UpdateExpression();

      setFields(updateExpression, {
        latestTSSynced,
      });

      return updateExpression.serialize(attributes);
    })(),
    ...withAttributes(attributes),
  });
}

const snapshotUpdateStatusKey = makeKey({
  PartitionKey: "SnapshotSyncStatus",
  SortKey: "fixed",
});

export async function fetchSnapshotSyncStatus(
  dynamo: DynamoDB
): Promise<{ latestTSSynced: number } | null> {
  const result = await dynamo.getItem({
    TableName,
    Key: snapshotUpdateStatusKey as Record<string, AttributeValue>,
    ConsistentRead: true,
  });

  if (!result.Item) {
    return null;
  }

  return marshaller.unmarshallItem(result.Item) as any;
}
