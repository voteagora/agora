import { S3 } from "@aws-sdk/client-s3";
import { chunk } from "lodash";
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

const spaceId = "ens.eth";

export async function run() {
  const Bucket = process.env.S3_BUCKET!;

  const s3 = new S3({});

  const dynamo = new DynamoDB({
    retryMode: "standard",
  });

  const [proposals, votes, space] = await Promise.all([
    getAllFromQuery(proposalsQuery, {
      space: spaceId,
    }),
    getAllFromQuery(votesQuery, {
      space: spaceId,
    }),
    request({
      url,
      document: spaceQuery,
      variables: {
        space: spaceId,
      },
    }),
  ]);

  await Promise.all([
    s3.putObject({
      Bucket,
      Key: `${spaceId}/votes.json`,
      Body: JSON.stringify(votes),
    }),
    s3.putObject({
      Bucket,
      Key: `${spaceId}/space.json`,
      Body: JSON.stringify(space),
    }),
    s3.putObject({
      Bucket,
      Key: `${spaceId}/votes.json`,
      Body: JSON.stringify(votes),
    }),
    writeVotesToDynamoDb(dynamo, votes, space, proposals),
  ]);
}

async function writeVotesToDynamoDb(
  dynamo,
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
                        SortKey: item.created.toString().padStart(12, "0"),
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