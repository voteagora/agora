import { S3 } from "@aws-sdk/client-s3";
import { chunk } from "lodash";
import {
  fetchProposals,
  fetchVotes,
  GetAllFromQueryResult,
  proposalsQuery,
  ResultOf,
  spaceQuery,
  url,
  votesQuery,
} from "../../bin/scripts/loadSnapshotVotes/queries";
import request from "graphql-request";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { makeKey, marshaller } from "../../store/dynamo/utils";
import { collectGenerator } from "../../indexer/utils/generatorUtils";

export const spaceId = "opcollective.eth";

export async function fetchEverything() {
  const [proposals, space, votes] = await Promise.all([
    (await collectGenerator(fetchProposals(spaceId))).flat(),
    request({
      url,
      document: spaceQuery,
      variables: {
        space: spaceId,
      },
    }),
    (await collectGenerator(fetchVotes(spaceId))).flat(),
  ]);

  return {
    proposals,
    space,
    votes,
  };
}

export async function run() {
  const Bucket = process.env.S3_BUCKET!;

  const s3 = new S3({});

  const dynamo = new DynamoDB({
    retryMode: "standard",
  });

  const { proposals, space, votes } = await fetchEverything();

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
      Key: `${spaceId}/proposals.json`,
      Body: JSON.stringify(proposals),
    }),
    writeVotesToDynamoDb(dynamo, votes, space, proposals),
  ]);
}
