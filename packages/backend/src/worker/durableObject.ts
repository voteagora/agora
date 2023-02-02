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
import {
  batch,
  limitGenerator,
  skipFirst,
} from "../indexer/utils/generatorUtils";
import {
  alarmValueKey,
  makeYieldingWorkloadExecutor,
  YieldingWorkloadExecutor,
} from "./yieldingWorkload";
import { AdminWebsocketMessage } from "../indexer/adminSocket/types";

export class StorageDurableObjectV1 {
  private readonly state: DurableObjectState;
  private readonly env: Env;
  private readonly provider: ethers.providers.JsonRpcProvider;

  private readonly yieldingWorkload: YieldingWorkloadExecutor<{
    startingLineNumber: number;
  }>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.provider = new ethers.providers.AlchemyProvider(
      "optimism",
      env.ALCHEMY_API_KEY
    );

    this.yieldingWorkload = makeYieldingWorkloadExecutor<{
      startingLineNumber: number;
    }>(this.state.storage, async (nextValue) => {
      const startingLineNumber = nextValue?.startingLineNumber ?? 0;
      console.log({ startingLineNumber });
      if (startingLineNumber === 0) {
        await this.state.storage.deleteAll({
          allowConcurrency: true,
          noCache: true,
          allowUnconfirmed: true,
        });
      }

      const inputHandle = await this.env.INDEXER_DUMPS.get("input.jsonl");
      if (!inputHandle) {
        throw new Error("input.jsonl not found");
      }

      const lines = inputHandle.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream());

      let nextStartingLineNumber = startingLineNumber;

      const entriesBatchSize = 128;

      for await (const entriesBatch of batch(
        (async function* () {
          for await (const line of limitGenerator(
            skipFirst(lines, startingLineNumber),
            entriesBatchSize * 1000
          )) {
            nextStartingLineNumber++;
            if (!line.length) {
              continue;
            }

            const object = JSON.parse(line) as StoredEntry;

            yield object;
          }
        })(),
        entriesBatchSize
      )) {
        this.state.storage.put(
          Object.fromEntries(entriesBatch.map((it) => [it.key, it.value])),
          {
            allowConcurrency: true,
            allowUnconfirmed: true,
            noCache: true,
          }
        );

        if (entriesBatchSize > entriesBatch.length) {
          return {
            type: "TERMINATE",
          };
        }
      }

      console.log({ nextStartingLineNumber });

      return {
        type: "REPEAT",
        value: {
          startingLineNumber: nextStartingLineNumber,
        },
      };
    });
  }

  async fetchWithSentry(request: Request, sentry: Toucan): Promise<Response> {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/load": {
        await this.yieldingWorkload.start();

        return new Response("loaded first chunk from input.jsonl");
      }

      case "/admin/ws": {
        const upgradeHeader = request.headers.get("Upgrade");
        if (!upgradeHeader || upgradeHeader !== "websocket") {
          return new Response("Expected Upgrade: websocket", { status: 426 });
        }

        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        // @ts-ignore
        server.accept();

        server.addEventListener("message", (event) => {
          const message: AdminWebsocketMessage = JSON.parse(event.data);

          this.state.storage.put(
            Object.fromEntries(message.items.map((it) => [it.key, it.value]))
          );
        });

        return new Response(null, {
          status: 101,
          webSocket: client,
        });
      }

      case "/inspect": {
        const entityStore = new DurableObjectEntityStore(this.state.storage);
        const value = await this.state.storage.get(alarmValueKey);
        const finalizedBlock = await entityStore.getFinalizedBlock();
        return new Response(JSON.stringify({ value, finalizedBlock }));
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

  async alarm() {
    await this.yieldingWorkload.execute();
  }
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
