import "isomorphic-fetch";
import { createServer } from "@graphql-yoga/node";
import { makeGatewaySchema } from "../schema";
import { useTiming } from "@envelop/core";
import { AgoraContextType, StatementStorage, StoredStatement } from "../model";
import { presetDelegateStatements } from "../presetStatements";
import { ValidatedMessage } from "../utils/signing";
import {
  makeEmptyTracingContext,
  makeFakeSpan,
  makeNoOpCache,
} from "../utils/cache";
import { useApolloTracing } from "@envelop/apollo-tracing";
import { promises as fs } from "fs";
import { parseStorage } from "../snapshot";

async function main() {
  const delegateStatements = new Map(presetDelegateStatements);
  const schema = makeGatewaySchema();

  const snapshot = parseStorage(
    JSON.parse(await fs.readFile("snapshot.json", { encoding: "utf-8" }))
  );

  const context: AgoraContextType = {
    snapshot,
    statementStorage: makeStatementStorageFromMap(delegateStatements),
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
    plugins: [useTiming(), useApolloTracing()],
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
