import { SiweMessage, generateNonce } from "siwe";
import { SignJWT, jwtVerify } from "jose";

// ----------------
// Nonce
// ----------------

export function makeSIWENonce() {
  return generateNonce();
}

// ----------------
// Verify
// ----------------

export async function verifySIWEMessage(
  reqMessage: string,
  signature: string,
  nonce: string,
  jwtSecret: string
) {
  let SIWEObject = new SiweMessage(reqMessage);
  const { data: message, success } = await SIWEObject.verify({
    signature,
    nonce,
  });

  if (success) {
    const expiryTimespan = message.expirationTime
      ? new Date(message.expirationTime).getTime() - Date.now()
      : 3600 * 1000 * 2; // defaults to 2 hours
    const expiry = Math.floor(Date.now() / 1000) + expiryTimespan;
    const secret = new TextEncoder().encode(jwtSecret);
    const jwtToken = await new SignJWT({
      address: message.address,
      chainId: message.chainId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(expiry)
      .sign(secret);

    return { success, jwt: jwtToken, expiryTimespan };
  } else {
    return { success: false };
  }
}

// ----------------
// Session
// ----------------

export async function verifySIWESession(token: string, jwtSecret: string) {
  const secret = new TextEncoder().encode(jwtSecret);
  return await jwtVerify(token, secret);
}
