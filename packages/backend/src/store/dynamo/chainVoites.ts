import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { ChainVoteStorage, Vote } from "../../model";
import { makeKey, marshaller, TableName, withAttributes } from "./utils";
import {
  equals,
  ExpressionAttributes,
  serializeConditionExpression,
} from "@aws/dynamodb-expressions";
import { chunk } from "lodash";
import { ProposalRaw, VoteRaw } from "../../snapshot";

export function makeChainVotesStorage(dynamo: DynamoDB): ChainVoteStorage {
  return {
    async getChainVotesByVoter(address: string): Promise<Vote[]> {
      const expressionAttributes = new ExpressionAttributes();
      const result = await dynamo.query({
        TableName,
        KeyConditionExpression: serializeConditionExpression(
          {
            subject: "PartitionKey",
            ...equals(`Vote#${address.toLowerCase()}`),
          },
          expressionAttributes
        ),
        ...withAttributes(expressionAttributes),
      });

      return result.Items.map((it) => marshaller.unmarshallItem(it)).flatMap(
        (it) => {
          if (!it.proposal) {
            return [];
          }

          return [it];
        }
      ) as any;
    },
  };
}

export async function writeVotesToDynamoDb(
  dynamo: DynamoDB,
  votes: Array<VoteRaw>,
  proposals: Array<[string, ProposalRaw]>
) {
  let i = 0;
  const batchSize = 25;
  const pageSize = 5;

  for (const items of chunk(votes, batchSize * pageSize)) {
    await Promise.all(
      chunk(items, batchSize).map((items) =>
        dynamo.batchWriteItem({
          RequestItems: {
            // todo: table name should be configurable?
            ApplicationData: items.flatMap((item) => {
              if (!item) {
                return [];
              }

              return [
                {
                  PutRequest: {
                    Item: {
                      ...makeKey({
                        PartitionKey: `Vote#${item.voter.toLowerCase()}`,
                        SortKey: item.transactionHash,
                      }),
                      ...marshaller.marshallItem({
                        ...item,

                        proposal: proposals.find(
                          (proposal) =>
                            proposal[0] === item.proposalId.toString()
                        )[1],
                      }),
                    } as any,
                  },
                },
              ];
            }),
          },
        })
      )
    );

    console.log(
      `put batch completed: ${i} of ${
        (votes?.length ?? 0) / (batchSize * pageSize)
      }`
    );
    i++;
  }
}
