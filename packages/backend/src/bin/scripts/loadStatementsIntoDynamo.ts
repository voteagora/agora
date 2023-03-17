import { DynamoDB } from "@aws-sdk/client-dynamodb";

import { loadJsonLines } from "../../utils/jsonLines";
import { marshaller, TableName } from "../../store/dynamo/utils";
import { makeDelegateStatementKey } from "../../store/dynamo/statement";
import { indexed } from "../../indexer/utils/generatorUtils";

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
