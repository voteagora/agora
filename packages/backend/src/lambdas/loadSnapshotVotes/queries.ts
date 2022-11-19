import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
import request from "graphql-request";
import { graphql } from "./graphql";
import { Exact } from "./graphql/graphql";

export const url = "https://hub.snapshot.org/graphql";

export const proposalsQuery = graphql(/* GraphQL */ `
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

export const votesQuery = graphql(/* GraphQL */ `
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

export async function getAllFromQuery<
  Query extends DocumentNode<Exact<{ items?: any[] | undefined | null }>, any>
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

    if (!result?.items?.length) {
      break;
    }

    allItems.push(...result.items);
  }

  return allItems;
}
