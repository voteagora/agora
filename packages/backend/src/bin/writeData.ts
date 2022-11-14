import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { parseStorage } from "../snapshot";
import { promises as fs } from "fs";
import { makeUpdateForAccount } from "../store/dynamo/delegates";

async function main() {
  const dynamoDb = new DynamoDB({});

  const snapshot = parseStorage(
    JSON.parse(await fs.readFile("snapshot.json", { encoding: "utf-8" }))
  );

  const accounts = Array.from(snapshot.ENSToken.accounts.entries()).map(
    ([address, value]) => ({
      ...value,
      address,
    })
  );

  for (const account of accounts) {
    console.log(account);
    await dynamoDb.transactWriteItems({
      TransactItems: [
        {
          Update: makeUpdateForAccount(account),
        },
      ],
    });
  }
}

main();
