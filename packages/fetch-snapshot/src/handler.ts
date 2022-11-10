import { S3 } from "@aws-sdk/client-s3";
import { chunk } from "lodash";
import {
  getAllFromQuery,
  proposalsQuery,
  spaceQuery,
  url,
  votesQuery,
} from "./queries";
import request from "graphql-request";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { makeKey, marshaller } from "./dynamo";
import { z } from "zod";

const spaceId = "ens.eth";

async function loadVotesIntoS3(s3: S3, Bucket: string) {
  const proposalsPromise = await (async () => {
    const proposals = await getAllFromQuery(proposalsQuery, {
      space: spaceId,
    });

    await s3.putObject({
      Bucket,
      Key: `${spaceId}/proposals.json`,
      Body: JSON.stringify(proposals),
    });
  })();

  const votesPromise = (async () => {
    const votes = await getAllFromQuery(votesQuery, {
      space: spaceId,
    });

    await s3.putObject({
      Bucket,
      Key: `${spaceId}/votes.json`,
      Body: JSON.stringify(votes),
    });
  })();

  const spacePromise = (async () => {
    const space = await request({
      url,
      document: spaceQuery,
      variables: {
        space: spaceId,
      },
    });

    await s3.putObject({
      Bucket,
      Key: `${spaceId}/space.json`,
      Body: JSON.stringify(space),
    });
  })();

  await votesPromise;
  await proposalsPromise;
  await spacePromise;
}

export async function run() {
  const Bucket = process.env.S3_BUCKET!;

  const s3 = new S3({});

  const dynamo = new DynamoDB({
    retryMode: "standard",
  });

  await loadVotesIntoS3(s3, Bucket);
  await writeVotesToDynamoDb(dynamo, s3, Bucket);
}

const snapshotVoteSchema = z.array(
  z.object({
    choice: z.array(z.number()).or(z.number()),
    created: z.number(),
    id: z.string(),
    reason: z.string(),
    voter: z.string(),
    proposal: z.object({
      id: z.string(),
    }),
  })
);

const snapshotProposalsSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    link: z.string(),
    choices: z.array(z.string()),
    scores: z.array(z.number()),
  })
);

async function loadVotes(s3: S3, Bucket: string) {
  const result = await s3.getObject({
    Bucket,
    Key: `${spaceId}/votes.json`,
  });
  if (!result.Body) {
    return;
  }

  return snapshotVoteSchema.parse(
    JSON.parse(await result.Body.transformToString())
  );
}

async function loadProposals(s3: S3, Bucket: string) {
  const result = await s3.getObject({
    Bucket,
    Key: `${spaceId}/proposals.json`,
  });
  if (!result.Body) {
    return;
  }

  return snapshotProposalsSchema.parse(
    JSON.parse(await result.Body.transformToString())
  );
}

async function writeVotesToDynamoDb(dynamo: DynamoDB, s3: S3, Bucket: string) {
  const votes = (await loadVotes(s3, Bucket)) ?? [];
  const proposals = (await loadProposals(s3, Bucket)) ?? [];

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
