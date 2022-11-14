import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  ExpressionAttributes,
  UpdateExpression,
  serializeConditionExpression,
  equals,
} from "@aws/dynamodb-expressions";
import { makeKey, setFields, withAttributes } from "../../store/dynamo/utils";

async function transitionLockState(
  expectedExistingHolder: string,
  nextHolder: string,
  dynamo: DynamoDB
) {
  const attributes = new ExpressionAttributes();

  await dynamo.updateItem({
    TableName: "ApplicationData",
    Key: makeKey({
      PartitionKey: "AcquireIngestUpdatesLock",
      SortKey: "fixed",
    }),
    UpdateExpression: (() => {
      const updateExpression = new UpdateExpression();

      setFields(updateExpression, {
        lockHolder: nextHolder,
      });

      return updateExpression.serialize(attributes);
    })(),
    ConditionExpression: (() => {
      return serializeConditionExpression(
        {
          subject: "lockHolder",
          ...equals(expectedExistingHolder),
        },
        attributes
      );
    })(),

    ...withAttributes(attributes),
  });
}

export async function acquireLock(executionId: string, dynamo: DynamoDB) {
  return await transitionLockState("UNLOCKED", executionId, dynamo);
}

export async function releaseLock(executionId: string, dynamo: DynamoDB) {
  return await transitionLockState(executionId, "UNLOCKED", dynamo);
}
