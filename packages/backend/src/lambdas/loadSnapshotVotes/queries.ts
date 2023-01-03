import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
import request from "graphql-request";
import { graphql } from "./graphql";
import { Exact } from "./graphql/graphql";
import { RateLimiter } from "limiter";

export const url = "https://hub.snapshot.org/graphql";

export const proposalsQuery = graphql(/* GraphQL */ `
  query ProposalsQuery($space: String!, $first: Int!, $cursor: Int) {
    items: proposals(
      where: { space: $space, created_lte: $cursor }
      orderBy: "created"
      orderDirection: desc
      first: $first
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

export const votesQuery = graphql(/* GraphQL */ `
  query VotesQuery($space: String!, $first: Int!, $cursor: Int) {
    items: votes(
      where: { space: $space, created_lte: $cursor }
      orderBy: "created"
      orderDirection: desc
      first: $first
    ) {
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

export const spaceQuery = graphql(/* GraphQL */ `
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

export type VariablesOf<Query extends DocumentNode<any, any>> =
  Query extends DocumentNode<any, infer Variables> ? Variables : never;

export type ResultOf<Query extends DocumentNode<any, any>> =
  Query extends DocumentNode<infer Result, any> ? Result : never;

export type GetAllFromQueryResult<
  Query extends DocumentNode<Exact<{ items?: any[] | undefined | null }>, any>
> = ResultOf<Query>["items"];

type LimitsType = {
  first: number;
  skip: number;
};

const defaultLimits: LimitsType = {
  first: 1000,
  skip: 5000,
};

const rateLimiter = new RateLimiter({
  interval: 20 * 1e3,
  tokensPerInterval: 60 * 0.5,
});

export async function getAllFromQuery<
  Query extends DocumentNode<
    Exact<{ items?: { created: number }[] | undefined | null }>,
    any
  >
>(
  query: Query,
  variables: Omit<VariablesOf<Query>, "first" | "cursor">,
  limits: LimitsType = defaultLimits
): Promise<ResultOf<Query>["items"]> {
  const allItems = [];
  let cursor = undefined;

  for (let pageIndex = 0; true; pageIndex++) {
    const first = limits.first;

    await rateLimiter.removeTokens(1);
    const result = await request({
      url,
      document: query,
      variables: {
        ...variables,
        first,
        cursor,
      } as any,
    });

    if (!result?.items?.length) {
      break;
    }

    const items = result.items;
    const lastItem = items[items.length - 1];
    const filteredItems = items.filter((it) => it.created !== lastItem.created);

    allItems.push(...filteredItems);
    if (cursor === lastItem.created) {
      if (items.length === limits.first) {
        throw new Error("many items with the same cursor value");
      }

      break;
    }

    cursor = lastItem.created;
  }

  return allItems;
}
