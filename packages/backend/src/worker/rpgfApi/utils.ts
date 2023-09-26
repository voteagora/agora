import { verifySIWESession } from "../../services/auth";
import { Env } from "../env";

export type Handler = (
  request: Request,
  env: Env,
  address?: string
) => Promise<Response>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
};

export async function handleOptionsRequest(request: Request) {
  if (
    request.headers.get("Origin") !== null &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null
  ) {
    // Handle CORS preflight requests.
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers": request.headers.get(
          "Access-Control-Request-Headers"
        )!,
      },
    });
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        Allow: "GET, HEAD, POST, OPTIONS",
      },
    });
  }
}

export function createResponse(
  body: string | object,
  status: number = 200,
  headers: Record<string, string> = {},
  request?: Request
) {
  if (request) {
    const url = new URL(request.url);
    const requestHeaders = request.headers.get(
      "Access-Control-Request-Headers"
    );
    if (requestHeaders) {
      return new Response(JSON.stringify(body), {
        status,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Headers": requestHeaders,
          "content-type": "application/json",
          ...headers,
        },
      });
    } else {
      return new Response(JSON.stringify(body), {
        status,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
          ...headers,
        },
      });
    }
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
}

export function authWrap(asyncFn: Handler): Handler {
  const wrapper = async (request: Request, env: Env) => {
    try {
      // Verify JWT & forward address to handler
      const cookies = request.headers.get("Cookie");
      if (cookies && cookies.includes("access-token")) {
        const jwt = cookies
          .split("; ")
          .find((row) => row.startsWith("access-token="))!
          .split("=")[1];

        try {
          const session = await verifySIWESession(jwt, env.JWT_SECRET);
          if (session?.payload?.address) {
            return asyncFn(request, env, session.payload.address as string);
          } else {
            return createResponse(
              { error: "Invalid or expired access token" },
              401,
              {},
              request
            );
          }
        } catch (error) {
          return createResponse(
            { error: "Invalid or expired access token" },
            401,
            {},
            request
          );
        }
      } else {
        return createResponse(
          { error: "Missing access token" },
          401,
          {},
          request
        );
      }
    } catch (error) {
      return createResponse({ error }, 500, {}, request);
    }
  };

  return wrapper;
}

export function handlerWrap(asyncFunction: Handler): Handler {
  const wrapper = async (request: Request, env: Env, address?: string) => {
    try {
      return await asyncFunction(request, env, address);
    } catch (error) {
      return createResponse({ error }, 500, {}, request);
    }
  };

  return wrapper;
}
