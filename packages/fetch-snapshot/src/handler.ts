import { graphql } from "./graphql";
import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
import request from "graphql-request";
import S3 from "aws-sdk/clients/s3";

const url = "https://hub.snapshot.org/graphql";
const spaceId = "ens.eth";

const proposalsQuery = graphql(/* GraphQL */ `
  query ProposalsQuery($space: String!, $first: Int!, $skip: Int!) {
    items: proposals(
      where: { space: $space }
      orderBy: "id"
      first: $first
      skip: $skip
    ) {
      id
      app
      author
      body
      choices
      created
      discussion
      end
      ipfs
      link
      network
      plugins
      privacy
      quorum
      scores
      scores_by_strategy
      scores_state
      scores_total
      scores_updated
      snapshot
      start
      state
      strategies {
        network
        name
        params
      }
      symbol
      title
      type
      validation {
        params
        name
      }
      votes
    }
  }
`);

const votesQuery = graphql(/* GraphQL */ `
  query VotesQuery($space: String!, $first: Int!, $skip: Int!) {
    items: votes(where: { space: $space }, first: $first, skip: $skip) {
      app
      choice
      created
      id
      ipfs
      metadata
      proposal {
        id
      }

      reason
      voter
      vp
      vp_by_strategy
      vp_state
    }
  }
`);

const spaceQuery = graphql(/* GraphQL */ `
  query SpaceQuery($space: String) {
    space(id: $space) {
      id
      name

      about
      admins
      avatar
      categories
      children {
        id
      }

      coingecko
      domain
      email

      filters {
        minScore
        onlyMembers
      }

      followersCount
      github
      location
      members
      network
      parent {
        id
      }
      plugins
      private
      proposalsCount
      skin
      strategies {
        name
        params
        network
      }
      symbol
      terms
      treasuries {
        network
        name
        address
      }
      twitter
      validation {
        name
        params
      }
      voteValidation {
        params
        name
      }
      voting {
        aliased
        blind
        delay
        hideAbstain
        period
        privacy
        quorum
        type
      }
      website
    }
  }
`);

function logError<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((error) => {
    console.error(error);
    throw error;
  });
}

export async function run() {
  const Bucket = process.env.S3_BUCKET!;

  const s3 = new S3({});

  await Promise.allSettled(
    [
      (async () => {
        const proposals = await getAllFromQuery(proposalsQuery, {
          space: spaceId,
        });

        await s3
          .putObject({
            Bucket,
            Key: `${spaceId}/proposals.json`,
            Body: JSON.stringify(proposals),
          })
          .promise();
      })(),
      (async () => {
        const space = await request({
          url,
          document: spaceQuery,
          variables: {
            space: spaceId,
          },
        });

        await s3
          .putObject({
            Bucket,
            Key: `${spaceId}/space.json`,
            Body: JSON.stringify(space),
          })
          .promise();
      })(),
      (async () => {
        const votes = await getAllFromQuery(votesQuery, {
          space: spaceId,
        });

        await s3
          .putObject({
            Bucket,
            Key: `${spaceId}/votes.json`,
            Body: JSON.stringify(votes),
          })
          .promise();
      })(),
    ].map(logError)
  );
}

type VariablesOf<Query extends DocumentNode<any, any>> =
  Query extends DocumentNode<any, infer Variables> ? Variables : never;

type ResultOf<Query extends DocumentNode<any, any>> =
  Query extends DocumentNode<infer Result> ? Result : never;

async function getAllFromQuery<
  Query extends DocumentNode<{ items?: any[] | null }, any>
>(
  query: Query,
  variables: Omit<VariablesOf<Query>, "first" | "skip">
): Promise<ResultOf<Query>["items"]> {
  const pageSize = 20_000;

  const allItems = [];
  for (let pageIndex = 0; true; pageIndex++) {
    const result = await request({
      url,
      document: query,
      variables: {
        ...variables,
        first: pageSize,
        skip: pageSize * pageIndex,
      } as any,
    });

    if (!result.items.length) {
      break;
    }

    allItems.push(...result.items);
  }

  return allItems;
}
