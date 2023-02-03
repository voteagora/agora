import { Env } from "./env";
import { StoredEntry } from "../indexer/storage/dump";
import { readableStreamFromGenerator } from "../utils/readableStream";
import { listEntries } from "../indexer/storage/durableObjects/durableObjectReader";
import { getGraphQLCallingContext } from "./graphql";
import { useSentry } from "./useSentry";
import { createServer } from "@graphql-yoga/common";
import Toucan from "toucan-js";
import { makeToucanOptions, runReportingException } from "./sentry";
import { ethers } from "ethers";
import { makeInitialStorageArea } from "../indexer/followChain";
import { DurableObjectEntityStore } from "../indexer/storage/durableObjects/durableObjectEntityStore";
import { AdminMessage } from "../indexer/ops/adminMessage";

export class StorageDurableObjectV1 {
  private readonly state: DurableObjectState;
  private readonly env: Env;
  private readonly provider: ethers.providers.JsonRpcProvider;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.provider = new ethers.providers.AlchemyProvider(
      "optimism",
      env.ALCHEMY_API_KEY
    );
  }

  async fetchWithSentry(request: Request, sentry: Toucan): Promise<Response> {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/admin/ops": {
        if (request.method !== "POST") {
          throw new Error("invalid");
        }

        const message = await request.json<AdminMessage>();
        return await this.fetchAdminMessage(message);
      }

      case "/admin/dump": {
        const stream = dumpEntries(this.state.storage);
        return new Response(stream, {
          headers: {
            "Content-Disposition": 'attachment; filename="dump.jsonl"',
          },
        });
      }

      case "/graphql": {
        const isProduction = this.env.ENVIRONMENT === "prod";
        const entityStore = new DurableObjectEntityStore(this.state.storage);
        const storageArea = await makeInitialStorageArea(entityStore);
        const { schema, context } = await getGraphQLCallingContext(
          request,
          this.env,
          this.state.storage,
          this.provider,
          storageArea
        );

        const server = createServer({
          schema,
          context,
          maskedErrors: isProduction,
          graphiql: !isProduction,
          plugins: [useSentry(sentry)],
        });

        return server.handleRequest(request);
      }

      default: {
        return new Response("not found", { status: 404 });
      }
    }
  }

  async fetchAdminMessage(message: AdminMessage): Promise<Response> {
    switch (message.type) {
      case "WRITE_BATCH": {
        await Promise.all(
          message.items.map((items) =>
            this.state.storage.put(
              Object.fromEntries(items.map((it) => [it.key, it.value])),
              {
                allowConcurrency: true,
                noCache: true,
              }
            )
          )
        );
        break;
      }

      case "CLEAR_STORAGE": {
        await this.state.storage.deleteAll();
        break;
      }
    }

    return new Response();
  }

  async fetch(request: Request): Promise<Response> {
    const toucan = new Toucan(
      makeToucanOptions({ env: this.env, ctx: this.state })
    );

    return await runReportingException(toucan, () =>
      this.fetchWithSentry(request, toucan)
    );
  }

  async alarm() {}
}

function dumpEntries(
  storage: DurableObjectStorage
): ReadableStream<Uint8Array> {
  return readableStreamFromGenerator(
    (async function* () {
      for await (const [key, value] of listEntries(storage)) {
        const storedEntry: StoredEntry = { key, value };
        yield JSON.stringify(storedEntry) + "\n";
      }
    })()
  ).pipeThrough(new TextEncoderStream());
}
