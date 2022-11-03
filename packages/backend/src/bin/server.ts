import "isomorphic-fetch";
import { Plugin } from "@graphql-yoga/common";
import { createServer } from "@graphql-yoga/node";
import { makeGatewaySchema } from "../schema";
import { useTiming } from "@envelop/core";
import { AgoraContextType, StatementStorage, StoredStatement } from "../model";
import {
  makeStoredStatement,
  presetDelegateStatements,
} from "../presetStatements";
import { ValidatedMessage } from "../utils/signing";
import {
  makeEmptyTracingContext,
  makeFakeSpan,
  makeNoOpCache,
} from "../utils/cache";
import { useApolloTracing } from "@envelop/apollo-tracing";
import { promises as fs } from "fs";
import { parseStorage } from "../snapshot";
import { ethers } from "ethers";
import { fetchPostResponse } from "../discourse";
import * as path from "path";
import { z } from "zod";

async function discoursePostsByNumber() {
  const postsFolder = "./data/discourse/posts/";
  const postFiles = await fs.readdir(postsFolder);

  const mapping = new Map<number, z.infer<typeof fetchPostResponse>>();
  for (const file of postFiles) {
    const contents = await fs.readFile(path.join(postsFolder, file), {
      encoding: "utf-8",
    });

    const response = fetchPostResponse.parse(JSON.parse(contents));

    mapping.set(response.post_number, response);
  }

  return mapping;
}

const snapshotVoteSchema = z.array(
  z.object({
    choice: z.number(),
    created: z.number(),
    id: z.string(),
    reason: z.string(),
    voter: z.string(),
    proposal: z.object({
      id: z.string(),
    }),
  })
);

const snapshotProposalsSchema = z.object({
  proposals: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      choices: z.array(z.string()),
      scores: z.array(z.number()),
    })
  ),
});

export async function getSnapshotVotes() {
  const votes = snapshotVoteSchema.parse(
    JSON.parse(
      await fs.readFile("./data/snapshot/ens.eth/votes.json", {
        encoding: "utf-8",
      })
    )
  );

  const proposals = snapshotProposalsSchema.parse(
    JSON.parse(
      await fs.readFile("./data/snapshot/ens.eth/proposals.json", {
        encoding: "utf-8",
      })
    )
  );

  return {
    votes,
    proposals: proposals.proposals,
  };
}

async function main() {
  const discoursePostMapping = await discoursePostsByNumber();
  const delegateStatements = new Map();
  const schema = makeGatewaySchema();

  const provider = new ethers.providers.CloudflareProvider();

  const snapshot = parseStorage(
    JSON.parse(await fs.readFile("snapshot.json", { encoding: "utf-8" }))
  );

  const snapshotVotes = await getSnapshotVotes();

  const context: AgoraContextType = {
    snapshot,
    snapshotVotes,
    statementStorage: {
      async addStatement(statement: StoredStatement): Promise<void> {},
      async listStatements(): Promise<string[]> {
        return [];
      },
      async getStatement(address: string): Promise<StoredStatement | null> {
        const name = await provider.lookupAddress(address);
        if (!name) {
          return null;
        }

        const resolver = await provider.getResolver(name);
        if (!resolver) {
          return null;
        }

        const delegateValue = await resolver.getText("eth.ens.delegate");
        const withoutPrefix = stripPrefix(
          delegateValue,
          "https://discuss.ens.domains/t/ens-dao-delegate-applications/815/"
        );
        if (!withoutPrefix) {
          return null;
        }

        const post = discoursePostMapping.get(parseInt(withoutPrefix));

        return makeStoredStatement(address, {
          delegateStatement: post.raw,
        });
      },
    },

    cache: {
      cache: makeNoOpCache(),
      waitUntil: () => {},
      span: makeFakeSpan(),
    },
    emailStorage: {
      async addEmail(verifiedEmail: ValidatedMessage): Promise<void> {
        console.log({ verifiedEmail });
      },
    },
    tracingContext: makeEmptyTracingContext(),
  };

  const server = createServer({
    schema,
    context,
    port: 4001,
    maskedErrors: false,
    plugins: [useTiming(), useApolloTracing(), useErrorInspection()],
  });
  await server.start();
}

function makeStatementStorageFromMap(
  delegateStatements: Map<string, StoredStatement>
): StatementStorage {
  return {
    async getStatement(address: string): Promise<StoredStatement> {
      return delegateStatements.get(address.toLowerCase()) ?? null;
    },
    async addStatement(statement: StoredStatement): Promise<void> {
      delegateStatements.set(statement.address.toLowerCase(), statement);
    },
    async listStatements(): Promise<string[]> {
      return Array.from(delegateStatements.keys()).map((it) =>
        it.toLowerCase()
      );
    },
  };
}

main();

function useErrorInspection(): Plugin<AgoraContextType> {
  return {
    onResolverCalled({ info, context }) {
      return ({ result }) => {
        if (result instanceof Error) {
          console.log(info);
          return result;
        }

        return result;
      };
    },
  };
}

function stripPrefix(str: string, prefix: string) {
  if (str.startsWith(prefix)) {
    return str.replace(prefix, "");
  }

  return null;
}
