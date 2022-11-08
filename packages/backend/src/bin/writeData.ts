import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { parseStorage } from "../snapshot";
import { promises as fs } from "fs";
import {
  makeKey,
  marshaller,
  PartitionKey__MergedDelegatesStatementHolders,
  PartitionKey__MergedDelegatesVotingPower,
  setFields,
  TableName,
  updateExpression,
} from "../store/dynamo/utils";
import { makeMergedDelegateKey } from "../store/dynamo/delegates";

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
          Put: {
            TableName,
            Item: {
              ...makeKey({
                PartitionKey: "Account",
                SortKey: account.address,
              }),
              ...marshaller.marshallItem(account),
            },
          },
        },
        {
          Update: {
            TableName,
            Key: makeMergedDelegateKey(account.address),

            ...updateExpression((exp) =>
              setFields(exp, {
                PartitionKey__MergedDelegatesStatementHolders,
                PartitionKey__MergedDelegatesVotingPower,
                SortKey__MergedDelegatesVotingPower: account.represented
                  .toHexString()
                  .replace("0x", "")
                  .toLowerCase()
                  .padStart(256 / 4, "0"),
                address: account.address.toLowerCase(),
                tokensOwned: account.balance.toString(),
                tokensRepresented: account.represented.toString(),
                tokenHoldersRepresented: account.representing.length,
              })
            ),
          },
        },
      ],
    });
  }
}

main();
