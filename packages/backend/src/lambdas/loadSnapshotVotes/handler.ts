import { S3 } from "@aws-sdk/client-s3";
import {
  getAllFromQuery,
  GetAllFromQueryResult,
  proposalsQuery,
  ResultOf,
  spaceQuery,
  url,
  votesQuery,
} from "./queries";
import request from "graphql-request";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { makeKey, marshaller } from "../../store/dynamo/utils";
import {
  batch,
  collectGenerator,
  flatten,
  indexed,
} from "../../indexer/utils/generatorUtils";
import {
  fetchSnapshotSyncStatus,
  updateSnapshotSyncStatus,
} from "./snapshotSyncStatus";
import { chunk } from "lodash";

const spaceId = "ens.eth";

export async function run() {
  const dynamo = new DynamoDB({
    retryMode: "standard",
  });

  const last = await fetchSnapshotSyncStatus(dynamo);

  console.log(last && last.latestTSSynced);

  const [proposals, votes, space] = await Promise.all([
    collectGenerator(
      flatten(
        getAllFromQuery(proposalsQuery, {
          space: spaceId,
        })
      )
    ),
    getAllFromQuery(
      votesQuery,
      {
        space: spaceId,
      },
      last?.latestTSSynced
    ),
    request({
      url,
      document: spaceQuery,
      variables: {
        space: spaceId,
      },
    }),
  ]);

  await Promise.all([
    writeVotesToDynamoDb(dynamo, votes, proposals, last?.latestTSSynced),
  ]);
}

async function writeVotesToDynamoDb(
  dynamo: DynamoDB,
  votePages: AsyncGenerator<GetAllFromQueryResult<typeof votesQuery>>,
  proposals: GetAllFromQueryResult<typeof proposalsQuery>,
  latestTSSynced?: number
) {
  const batchSize = 25;
  const pageSize = 5;

  for await (const [idx, items] of indexed(
    batch(flatten(votePages), batchSize * pageSize)
  )) {
    await Promise.all(
      chunk(items, batchSize).map((itemsChunk) =>
        dynamo.batchWriteItem({
          RequestItems: {
            ApplicationData: itemsChunk.flatMap((item) => {
              if (!item) {
                return [];
              }

              if (item.created) {
                latestTSSynced = latestTSSynced
                  ? Math.max(latestTSSynced, item.created)
                  : item.created;
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

    console.log(`put batch completed: ${idx}`);
  }

  console.log({ latestTSSynced });

  if (latestTSSynced) {
    await updateSnapshotSyncStatus(latestTSSynced, dynamo);
  }
}
