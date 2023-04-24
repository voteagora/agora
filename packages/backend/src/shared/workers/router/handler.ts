import { Context } from "../context";

import { Handler, RouteDefinition } from "./route";

export function makeHandler<Env>(
  ...routeDefs: RouteDefinition<Env>[]
): Handler<Env> {
  return async (request, env, ctx) => {
    return handleRoute(routeDefs, request, env, ctx);
  };
}

export async function handleRoute<Env>(
  routeDefs: RouteDefinition<Env>[],
  request: Request,
  env: Env,
  ctx: Context
): Promise<Response> {
  const url = new URL(request.url);

  for (const routeDef of routeDefs) {
    if (!routeDef.matcher(request, url, env)) {
      continue;
    }

    return await routeDef.handle(request, env, ctx);
  }

  return new Response("not found", { status: 404 });
}
