import { Env, safelyLoadBlockStepSize } from "./env";
import { StoredEntry } from "../indexer/storage/dump";
import { readableStreamFromGenerator } from "../utils/readableStream";
import { getGraphQLCallingContext } from "./graphql";
import { useSentry } from "./useSentry";
import { createServer } from "@graphql-yoga/common";
import { Toucan } from "toucan-js";
import { makeToucanOptions, runReportingException } from "./sentry";
import { ethers } from "ethers";
import { followChain, makeInitialStorageArea } from "../indexer/followChain";
import { DurableObjectEntityStore } from "../indexer/storage/durableObjects/durableObjectEntityStore";
import { AdminMessage } from "../indexer/ops/adminMessage";
import { indexers } from "../indexer/contracts";
import { listEntries } from "../indexer/storage/durableObjects/storageInterface";
import {
  collectGenerator,
  limitGenerator,
} from "../indexer/utils/generatorUtils";
import { AnalyticsEngineReporter } from "../indexer/storage/durableObjects/analyticsEngineReporter";
import { EthersBlockProvider } from "../indexer/blockProvider/blockProvider";
import { EthersLogProvider } from "../indexer/logProvider/logProvider";
import { entityDefinitions } from "../indexer/contracts/entityDefinitions";

export const blockUpdateIntervalSeconds = 10;

export class StorageDurableObjectV1 {
  private readonly state: DurableObjectState;
  private readonly env: Env;
  private readonly provider: ethers.providers.JsonRpcProvider;

  private readonly storage: AnalyticsEngineReporter;
  private readonly stepChainEntityStore: DurableObjectEntityStore;
  private lastResult: Awaited<
    ReturnType<ReturnType<typeof followChain>>
  > | null = null;

  private iter: ReturnType<typeof followChain> | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.provider = new ethers.providers.AlchemyProvider(
      "mainnet",
      env.ALCHEMY_API_KEY
    );

    this.storage = new AnalyticsEngineReporter(
      this.state.storage,
      env.STORAGE_ANALYTICS
    );
    this.stepChainEntityStore = new DurableObjectEntityStore(this.storage);
  }

  async fetchWithSentry(request: Request, sentry: Toucan): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/admin/")) {
      if (request.headers.get("x-admin-api-key") !== this.env.ADMIN_API_KEY) {
        return new Response("invalid value for x-admin-api-key", {
          status: 401,
        });
      }

      switch (url.pathname) {
        case "/admin/ops": {
          if (request.method !== "POST") {
            return new Response("not found", { status: 404 });
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

        default: {
          return new Response("not found", { status: 404 });
        }
      }
    }

    switch (url.pathname) {
      case "/inspect": {
        const entityStore = new DurableObjectEntityStore(this.state.storage);
        return new Response(
          JSON.stringify({
            id: {
              name: this.state.id.name,
              id: this.state.id.toString(),
            },
            alarm: await this.state.storage.getAlarm(),
            stopSentinel:
              (await this.state.storage.get(stopSentinel)) ?? "empty",
            lastResult: this.lastResult,
            block: await entityStore.getFinalizedBlock(),
          })
        );
      }

      case "/graphql": {
        const isProduction = this.env.ENVIRONMENT === "prod";
        const storage = new AnalyticsEngineReporter(
          this.state.storage,
          this.env.STORAGE_ANALYTICS
        );

        const entityStore = new DurableObjectEntityStore(storage);

        const storageArea = await makeInitialStorageArea(entityStore);
        const { schema, context } = await getGraphQLCallingContext(
          request,
          this.env,
          storage,
          this.provider,
          storageArea
        );

        try {
          const server = createServer({
            schema,
            context,
            maskedErrors: isProduction,
            graphiql: !isProduction,
            plugins: [useSentry(sentry)],
          });

          const response = await server.handleRequest(request);
          return response;
        } finally {
          storage.flushIoReport(["kind:read"]);
        }
      }

      default: {
        return new Response("not found", { status: 404 });
      }
    }
  }

  async fetchAdminMessage(message: AdminMessage): Promise<Response> {
    switch (message.type) {
      case "START": {
        await this.state.storage.setAlarm(Date.now());
        break;
      }

      case "GET_KEYS": {
        const entries = await collectGenerator(
          limitGenerator(
            listEntries(this.state.storage, {
              start: message.cursor,
            }),
            10000
          )
        );

        return new Response(JSON.stringify(entries));
      }

      case "RESET": {
        await this.state.blockConcurrencyWhile(async () => {
          throw new Error("object reset!");
        });
        break;
      }

      case "STOP": {
        await this.state.storage.put(stopSentinel, true);
        break;
      }

      case "STEP": {
        await this.stepChainForward();
        break;
      }

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

      default:
        throw new Error(`unknown type ${(message as any).type}`);
    }

    return new Response();
  }

  async stepChainForward() {
    await this.stepChainEntityStore.ensureConsistentState();

    const iter =
      this.iter ??
      (await (async () => {
        const storageArea = await makeInitialStorageArea(
          this.stepChainEntityStore
        );
        const blockProvider = new EthersBlockProvider(this.provider);
        const logProvider = new EthersLogProvider(this.provider);
        return followChain(
          this.stepChainEntityStore,
          indexers,
          entityDefinitions,
          blockProvider,
          logProvider,
          storageArea
        );
      })());

    try {
      return await iter();
    } finally {
      this.storage.flushIoReport(["kind:write"]);
    }
  }

  async alarmWithSentry() {
    const stopSentinelValue = await this.state.storage.get(stopSentinel);
    if (stopSentinelValue) {
      await this.state.storage.delete(stopSentinel);
      return;
    }

    const result = await this.stepChainForward();
    this.lastResult = result;
    await this.state.storage.setAlarm(
      (() => {
        if (
          result.type === "TIP" ||
          (result.type === "MORE" && result.depth <= 0)
        ) {
          return Date.now() + 1000 * blockUpdateIntervalSeconds;
        }

        return Date.now();
      })()
    );
  }

  async fetch(request: Request): Promise<Response> {
    const toucan = new Toucan({
      ...makeToucanOptions({ env: this.env, ctx: this.state }),
      request,
    });

    toucan.setTags({
      deployment: this.env.DEPLOYMENT,
      entrypoint: "StorageDurableObjectV1.fetch",
    });

    return await runReportingException(toucan, () =>
      this.fetchWithSentry(request, toucan)
    );
  }

  async alarm() {
    const toucan = new Toucan(
      makeToucanOptions({ env: this.env, ctx: this.state })
    );

    toucan.setTags({
      deployment: this.env.DEPLOYMENT,
      entrypoint: "StorageDurableObjectV1.alarm",
    });

    return await runReportingException(toucan, () => this.alarmWithSentry());
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

const stopSentinel = "stopSentinel";
