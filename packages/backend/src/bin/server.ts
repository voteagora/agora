import "isomorphic-fetch";
import { createServer } from "@graphql-yoga/node";
import { makeGatewaySchema } from "../schema";
import { useTiming } from "@envelop/core";
import { AgoraContextType, StatementStorage, StoredStatement } from "../model";
import { presetDelegateStatements } from "../presetStatements";
import { makeNounsExecutor } from "../schemas/nouns-subgraph";
import { ValidatedMessage } from "../utils/signing";
import { makeInMemoryCache } from "../utils/cache";
import { makeCachePlugin } from "../cache";
import { createInMemoryCache } from "@envelop/response-cache";

async function main() {
  const delegateStatements = new Map(presetDelegateStatements);
  const schema = makeGatewaySchema();
  const cache = createInMemoryCache();

  const context: AgoraContextType = {
    statementStorage: makeStatementStorageFromMap(delegateStatements),
    nounsExecutor: makeNounsExecutor(),
    cache: {
      cache: makeInMemoryCache(),
      waitUntil: () => {},
    },
    emailStorage: {
      async addEmail(verifiedEmail: ValidatedMessage): Promise<void> {
        console.log({ verifiedEmail });
      },
    },
  };

  const server = createServer({
    schema,
    context,
    port: 4001,
    maskedErrors: false,
    plugins: [useTiming()],
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
