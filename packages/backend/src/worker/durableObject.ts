import { Env } from "./env";
import { TextLineStream } from "../utils/TextLineStream";
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
      case "/load": {
        const inputHandle = await this.env.INDEXER_DUMPS.get("input.jsonl");
        if (!inputHandle) {
          throw new Error("input.jsonl not found");
        }

        await loadEntries(inputHandle, this.state.storage);

        return new Response("loaded from input.jsonl");
      }

      case "/dump": {
        await this.env.INDEXER_DUMPS.put(
          "output.jsonl",
          dumpEntries(this.state.storage)
        );

        return new Response("dumped to output.jsonl");
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

async function loadEntries(
  r2ObjectBody: R2ObjectBody,
  storage: DurableObjectStorage
) {
  const lines = r2ObjectBody.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  await storage.transaction(async (tx) => {
    for await (const line of lines) {
      if (!line.length) {
        continue;
      }

      const object = JSON.parse(line) as StoredEntry;

      tx.put(object.key, object.value, {
        allowConcurrency: true,
        allowUnconfirmed: true,
        noCache: true,
      });
    }
  });
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
