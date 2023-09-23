import { verifySIWESession } from "../../services/auth";
import { Env } from "../env";

export type Handler = (
  request: Request,
  env: Env,
  address?: string
) => Promise<Response>;

export function createResponse(
  body: string | object,
  status: number = 200,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*",
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
              401
            );
          }
        } catch (error) {
          return createResponse(
            { error: "Invalid or expired access token" },
            401
          );
        }
      } else {
        return createResponse({ error: "Missing access token" }, 401);
      }
    } catch (error) {
      return createResponse({ error }, 500);
    }
  };

  return wrapper;
}

export function handlerWrap(asyncFunction: Handler): Handler {
  const wrapper = async (request: Request, env: Env, address?: string) => {
    try {
      return await asyncFunction(request, env, address);
    } catch (error) {
      return createResponse({ error }, 500);
    }
  };

  return wrapper;
}
