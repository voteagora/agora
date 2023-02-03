import {
  GetAllFromQueryResult,
  proposalsQuery,
  ResultOf,
  spaceQuery,
  url,
  votesQuery,
} from "./loadSnapshotVotes/queries";
import { chunk } from "lodash";
import { makeKey, marshaller } from "../../store/dynamo/utils";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { loadJsonLines } from "../../utils/jsonLines";
import { collectGenerator } from "../../indexer/utils/generatorUtils";
import request from "graphql-request";

const spaceId = "opcollective.eth";

async function main() {
  const dynamo = new DynamoDB({
    retryMode: "standard",
  });

  const [votes, proposals, space] = await Promise.all([
    collectGenerator(loadJsonLines("data/snapshot/votes.jsonl")),
    collectGenerator(loadJsonLines("data/snapshot/proposals.jsonl")),
    request({
      url,
      document: spaceQuery,
      variables: {
        space: spaceId,
      },
    }),
  ]);

  await writeVotesToDynamoDb(dynamo, votes as any, space, proposals as any);
}

main();

export async function writeVotesToDynamoDb(
  dynamo: DynamoDB,
  votes: GetAllFromQueryResult<typeof votesQuery>,
  space: ResultOf<typeof spaceQuery>,
  proposals: GetAllFromQueryResult<typeof proposalsQuery>
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
                        PartitionKey: `SnapshotVote#${item.voter.toLowerCase()}`,
                        SortKey:
                          item.created.toString().padStart(12, "0") +
                            "#" +
                            item.proposal?.id ?? "null",
                      }),
                      ...marshaller.marshallItem({
                        ...item,
                        proposal: proposals.find(
                          (proposal) => proposal?.id === item.proposal?.id
                        ),
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
