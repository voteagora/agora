import { ethers } from "ethers";
import { Env, mustGetAlchemyApiKey } from "../env";
import {
  isBadgeholder,
  isTrezor,
  makeSIWENonce,
  verifySIWEMessage,
  verifySIWESession,
} from "../../services/auth";
import { createResponse } from "./utils";
import { Reader } from "../../indexer/storage/reader";
import { entityDefinitions } from "../../indexer/contracts";

export async function handleAuthRequest(
  path: string,
  request: Request,
  env: Env,
  reader: Reader<typeof entityDefinitions>
) {
  switch (path) {
    case "nonce":
      return handleNonceRequest(request);

    case "verify":
      return handleVerifyRequest(request, env);

    case "session":
      return handleSessionRequest(request, env);

    case "can-signin":
      return handleCanSigninRequest(request, env, reader);

    case "is-trezor":
      return handleIsTrezorRequest(request);

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

async function handleNonceRequest(request: Request) {
  try {
    const nonce = await makeSIWENonce();

    return createResponse({ nonce }, 200, {}, request);
  } catch (error) {
    return createResponse({ error }, 500, {}, request);
  }
}

// ----------------
// Verify
// ----------------

async function handleVerifyRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const provider = new ethers.providers.AlchemyProvider(
    "optimism",
    mustGetAlchemyApiKey(env)
  );
  try {
    const payload = (await request.json()) as any;

    const { message, signature, nonce } = payload;
    if (!message || !signature) {
      return createResponse({ error: "Invalid request" }, 400, {}, request);
    }

    if (nonce) {
      const { success, jwt } = await verifySIWEMessage(
        message,
        signature,
        nonce,
        env.JWT_SECRET,
        provider
      );
      if (success) {
        return createResponse({ accessToken: jwt }, 200, {}, request);
      } else {
        return createResponse(
          { error: "Invalid nonce or signature" },
          401,
          {},
          request
        );
      }
    } else {
      return createResponse({ error: "Missing nonce" }, 401, {}, request);
    }
  } catch (error) {
    return createResponse({ error }, 500, {}, request);
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
    // get bearer token from header
    const authorization = request.headers.get("Authorization");
    let accessToken = authorization?.split(" ")[1];

    if (accessToken) {
      try {
        const session = await verifySIWESession(accessToken, env.JWT_SECRET);
        if (session) {
          return createResponse({ session: session.payload }, 200, {}, request);
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
}

// ----------------
// Can Sign In
// ----------------

async function handleCanSigninRequest(
  request: Request,
  env: Env,
  reader: Reader<typeof entityDefinitions>
): Promise<Response> {
  try {
    const payload = (await request.json()) as any;

    const { address } = payload;
    if (!address) {
      return createResponse({ error: "Invalid request" }, 400, {}, request);
    }

    const canSignIn = await isBadgeholder(address, reader);
    return createResponse({ canSignIn }, 200, {}, request);
  } catch (error) {
    return createResponse({ error }, 500, {}, request);
  }
}

// ----------------
// Is Trezor
// ----------------

async function handleIsTrezorRequest(request: Request): Promise<Response> {
  try {
    const payload = (await request.json()) as any;

    const { address } = payload;
    if (!address) {
      return createResponse({ error: "Invalid request" }, 400, {}, request);
    }

    const isTrezorWallet = await isTrezor(address);
    return createResponse({ isTrezor: isTrezorWallet }, 200, {}, request);
  } catch (error) {
    return createResponse({ error }, 500, {}, request);
  }
}
