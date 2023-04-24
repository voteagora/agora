import { Context } from "../context";

export type Matcher<Env> = (request: Request, url: URL, env: Env) => boolean;

export type Handler<Env> = (
  request: Request,
  env: Env,
  ctx: Context
) => Promise<Response>;

export type RouteDefinition<Env> = {
  matcher: Matcher<Env>;
  handle: Handler<Env>;
};

export function exactPathMatcher<Env>(path: string): Matcher<Env> {
  return (request, url) => url.pathname === path;
}

export function methodMatcher<Env>(method: string): Matcher<Env> {
  return (request) => request.method.toLowerCase() === method.toLowerCase();
}

export function combine<Env>(...matchers: Matcher<Env>[]): Matcher<Env> {
  return (request, url, env) =>
    matchers.findIndex((it) => !it(request, url, env)) === -1;
}

export function startsWithPathMatcher<Env>(prefix: string): Matcher<Env> {
  return (request, url) => url.pathname.startsWith(prefix);
}
