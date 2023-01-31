import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshaller, TableName } from "../../store/dynamo/utils";
import { makeDelegateStatementKey } from "../../store/dynamo/statement";
import { promises as fs } from "fs";
import { delegatesType } from "./downloadOptimismDelegateStatements/optimismClaimsService";
import { makeStoredStatement } from "../../presetStatements";

async function main() {
  const dynamo = new DynamoDB({});
  const statements = delegatesType.parse(
    JSON.parse(
      await fs.readFile("./data/statements.json", {
        encoding: "utf-8",
      })
    )
  );

  let idx = 0;
  for (const { address, description } of statements) {
    await dynamo.putItem({
      TableName,
      Item: {
        ...makeDelegateStatementKey(address.toLowerCase()),
        ...marshaller.marshallItem(
          makeStoredStatement(address.toLowerCase(), {
            delegateStatement: description,
          })
        ),
      } as any,
    });

    console.log({ idx, length: statements.length });

    idx++;
  }
}

main();
