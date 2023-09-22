import { Env } from "../env";
import {
  makeSIWENonce,
  verifySIWEMessage,
  verifySIWESession,
} from "../../services/auth";
import { createResponse } from "./utils";

export async function handleAuthRequest(
  path: string,
  request: Request,
  env: Env
) {
  switch (path) {
    case "nonce":
      return handleNonceRequest();

    case "verify":
      return handleVerifyRequest(request, env);

    case "session":
      return handleSessionRequest(request, env);

    case "signout":
      return handleSignOut();

    default:
      return createResponse(
        { error: `Invalid path: ${new URL(request.url).pathname}` },
        400
      );
  }
}

// ----------------
// Nonce
// ----------------

async function handleNonceRequest() {
  try {
    const nonce = await makeSIWENonce();

    return createResponse({ nonce }, 200, {
      "Set-Cookie": `nonce=${nonce}; Path=/; HttpOnly; Secure; SameSite=Strict; max-age=300`,
    });
  } catch (error) {
    return createResponse({ error }, 500);
  }
}

// ----------------
// Verify
// ----------------

async function handleVerifyRequest(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const { message, signature } = (await request.json()) as any;

    if (!message || !signature) {
      return createResponse({ error: "Invalid request" }, 400);
    }

    const cookies = request.headers.get("Cookie");
    if (cookies && cookies.includes("nonce")) {
      const nonce = cookies
        .split("; ")
        .find((row) => row.startsWith("nonce="))!
        .split("=")[1];

      const { success, jwt } = await verifySIWEMessage(
        message,
        signature,
        nonce,
        env.JWT_SECRET
      );
      if (success) {
        return createResponse({ success }, 200, {
          "Set-Cookie": `access-token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Strict; max-age=3600`, // TODO: define max-age
        });
      } else {
        return createResponse({ error: "Invalid nonce or signature" }, 401);
      }
    } else {
      return createResponse({ error: "Missing nonce cookie" }, 401);
    }
  } catch (error) {
    return createResponse({ error }, 500);
  }
}

// ----------------
// Session
// ----------------

async function handleSessionRequest(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Verify JWT & return session
    const cookies = request.headers.get("Cookie");
    if (cookies && cookies.includes("access-token")) {
      const jwt = cookies
        .split("; ")
        .find((row) => row.startsWith("access-token="))!
        .split("=")[1];

      try {
        const session = await verifySIWESession(jwt, env.JWT_SECRET);
        if (session) {
          return createResponse({ session: session.payload });
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
}

// ----------------
// Signout
// ----------------

async function handleSignOut() {
  // Remove cookies
  return createResponse({ success: true }, 200, {
    "Set-Cookie": `access-token=; Path=/; HttpOnly; Secure; SameSite=Strict; max-age=0`,
  });
}
