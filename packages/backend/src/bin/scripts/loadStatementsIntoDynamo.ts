import { DynamoDB } from "@aws-sdk/client-dynamodb";

import { indexed } from "../../indexer/utils/generatorUtils";
import { makeDelegateStatementKey } from "../../store/dynamo/statement";
import { marshaller, TableName } from "../../store/dynamo/utils";
import { loadJsonLines } from "../../utils/jsonLines";

type Line = {
  value: string;
  key: {
    name: string;
  };
};

async function main() {
  const dynamoDb = new DynamoDB({});

  for await (const [idx, line] of indexed(
    loadJsonLines<Line>("dd8a0cf1ad9c4e6b911a4e3da3cd334f.jsonl")
  )) {
    const address = line.key.name.toLowerCase();

    await dynamoDb.putItem({
      TableName,
      Item: {
        ...makeDelegateStatementKey(address),
        ...marshaller.marshallItem(JSON.parse(line.value)),
      } as any,
    });

    console.log({ idx });
  }
}

main();
