import { ethers } from "ethers";
import { graphql } from "./graphql";
import request from "graphql-request";
import { promises as fs } from "fs";
import path = require("path");

const url = "https://hub.snapshot.org/graphql";

const proposalsQuery = graphql(/* GraphQL */ `
  query ProposalsQuery($space: String!) {
    proposals(where: { space: $space }, orderBy: "id", first: 1000) {
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
    votes(where: { space: $space }, first: $first, skip: $skip) {
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

const spaceId = "ens.eth";

async function main() {
  const spacePath = `./data/snapshot/${spaceId}/`;
  await fs.mkdir(spacePath, { recursive: true });

  const proposals = await request({
    url,
    document: proposalsQuery,
    variables: {
      space: spaceId,
    },
  });
  await fs.writeFile(
    path.join(spacePath, "proposals.json"),
    JSON.stringify(proposals)
  );

  const votes = await getAllVotes();
  await fs.writeFile(path.join(spacePath, "votes.json"), JSON.stringify(votes));

  const space = await request({
    url,
    document: spaceQuery,
    variables: {
      space: spaceId,
    },
  });

  await fs.writeFile(path.join(spacePath, "space.json"), JSON.stringify(space));
}

async function getAllVotes() {
  const pageSize = 20_000;

  const allVotes = [];
  for (let pageIndex = 0; true; pageIndex++) {
    const votes = await request({
      url,
      document: votesQuery,
      variables: {
        space: spaceId,
        first: pageSize,
        skip: pageSize * pageIndex,
      },
    });

    if (!votes.votes.length) {
      break;
    }

    allVotes.push(...votes.votes);
  }

  return allVotes;
}

main();
