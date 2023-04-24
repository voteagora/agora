import { FollowChainDriver } from "../storageDurableObject/followChainDriver";
import {
  combine,
  exactPathMatcher,
  methodMatcher,
  RouteDefinition,
  startsWithPathMatcher,
} from "../router/route";
import { DurableObjectEntityStore } from "../../indexer/storage/entityStore/durableObjects/durableObjectEntityStore";
import { makeHandler } from "../router/handler";
import { collectGenerator, limitGenerator } from "../../utils/generatorUtils";
import { listEntries } from "../../indexer/storage/entityStore/durableObjects/storageInterface/storageInterface";
import { readableStreamFromGenerator } from "../../utils/readableStream";
import { StoredEntry } from "../../indexer/storage/dump";

import { AdminMessage } from "./type";

export function makeAdminRoutes(
  state: DurableObjectState,
  followChainDriver: FollowChainDriver
): RouteDefinition<{ ADMIN_API_KEY: string }>[] {
  return [
    {
      matcher: exactPathMatcher("/inspect"),
      handle: async () => {
        const entityStore = new DurableObjectEntityStore(state.storage);
        return new Response(
          JSON.stringify({
            id: {
              name: state.id.name,
              id: state.id.toString(),
            },
            alarm: await state.storage.getAlarm(),
            stopSentinel: (await state.storage.get(stopSentinel)) ?? "empty",
            lastResult: followChainDriver.lastResult,
            block: await entityStore.getFinalizedBlock(),
          })
        );
      },
    },
    {
      matcher: combine(
        startsWithPathMatcher("/admin/"),
        (request, url, env) =>
          request.headers.get("x-admin-api-key") === env.ADMIN_API_KEY
      ),
      handle: makeHandler(
        {
          matcher: combine(
            exactPathMatcher("/admin/ops"),
            methodMatcher("POST")
          ),
          async handle(request) {
            const message = await request.json<AdminMessage>();
            return await handleAdminMessage(message, state, followChainDriver);
          },
        },
        {
          matcher: exactPathMatcher("/admin/dump"),
          async handle() {
            const stream = readableStreamFromGenerator(
              (async function* () {
                for await (const [key, value] of listEntries(state.storage)) {
                  const storedEntry: StoredEntry = { key, value };
                  yield JSON.stringify(storedEntry) + "\n";
                }
              })()
            ).pipeThrough(new TextEncoderStream());
            return new Response(stream, {
              headers: {
                "Content-Disposition": 'attachment; filename="dump.jsonl"',
              },
            });
          },
        }
      ),
    },
  ];
}

async function handleAdminMessage(
  message: AdminMessage,
  state: DurableObjectState,
  followChainDriver: FollowChainDriver
): Promise<Response> {
  switch (message.type) {
    case "START": {
      await state.storage.setAlarm(Date.now());
      break;
    }

    case "GET_KEYS": {
      const entries = await collectGenerator(
        limitGenerator(
          listEntries(state.storage, {
            start: message.cursor,
          }),
          10000
        )
      );

      return new Response(JSON.stringify(entries));
    }

    case "RESET": {
      await state.blockConcurrencyWhile(async () => {
        throw new Error("object reset!");
      });
      break;
    }

    case "STOP": {
      await state.storage.put(stopSentinel, true);
      break;
    }

    case "STEP": {
      await followChainDriver.stepChainForward();
      break;
    }

    case "WRITE_BATCH": {
      await Promise.all(
        message.items.map((items) =>
          state.storage.put(
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
      await state.storage.deleteAll();
      break;
    }

    default:
      throw new Error(`unknown type ${(message as any).type}`);
  }

  return new Response();
}

export const stopSentinel = "stopSentinel";
