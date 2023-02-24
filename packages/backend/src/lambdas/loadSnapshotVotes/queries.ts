import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
import request from "graphql-request";
import { graphql } from "./graphql";
import { Exact } from "./graphql/graphql";
import { RateLimiter } from "limiter";

export const url = "https://hub.snapshot.org/graphql";

export function fetchProposals(space: string) {
  return getAllFromQuery(proposalsQuery, {
    space,
  });
}

export const proposalsQuery = graphql(/* GraphQL */ `
  query ProposalsQuery($space: String!, $first: Int!, $cursor: Int) {
    items: proposals(
      where: { space: $space, created_gte: $cursor }
      orderBy: "created"
      orderDirection: asc
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

export function fetchVotes(space: string) {
  return getAllFromQuery(votesQuery, {
    space,
  });
}

export const votesQuery = graphql(/* GraphQL */ `
  query VotesQuery($space: String!, $first: Int!, $cursor: Int) {
    items: votes(
      where: { space: $space, created_gte: $cursor }
      orderBy: "created"
      orderDirection: asc
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
> = Array<NonNullable<NonNullable<ResultOf<Query>["items"]>[0]>>;

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

export async function* getAllFromQuery<
  Query extends DocumentNode<
    { items?: ({ created: number, id: string } | null)[] | undefined | null },
    any
  >
>(
  query: Query,
  variables: Omit<VariablesOf<Query>, "first" | "cursor">,
  initialCursor?: number,
  limits: LimitsType = defaultLimits
): AsyncGenerator<GetAllFromQueryResult<Query>> {
  let cursor = initialCursor;

  for (let pageIndex = 0; true; pageIndex++) {
    const first = limits.first;

    for (let attemptIdx = 0; attemptIdx < 10; attemptIdx++) {
      let result;
      try {
        await rateLimiter.removeTokens(1);

        result = await request({
          url,
          document: query,
          variables: {
            ...variables,
            first,
            cursor,
          } as any,
        });
      } catch (e) {
        console.error(e);
        continue;
      }

      const items: Array<
        NonNullable<NonNullable<ResultOf<Query>["items"]>[0]> & {
          created: number;
        }
      > = (result.items ?? []).flatMap((it) => {
        if (it) {
          return [it];
        } else {
          return [];
        }
      }) as any;
      const lastItem = items[items.length - 1];

      yield items;

      if (cursor === lastItem.created) {
        if (items.length === limits.first) {
          throw new Error("many items with the same cursor value");
        }

        return;
      }

      cursor = lastItem.created;
      break;
    }
  }
}
