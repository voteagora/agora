import { ethers } from "ethers";
import { SiweMessage, generateNonce } from "siwe";
import { SignJWT, jwtVerify } from "jose";
import { Reader, exactIndexValue } from "../indexer/storage/reader";
import { entityDefinitions } from "../indexer/contracts";
import {
  collectGenerator,
  filterGenerator,
} from "../indexer/utils/generatorUtils";
import PrismaSingleton from "../store/prisma/client";
import { validateSafeSignature, validateSigned } from "../utils/signing";
import { SingatureType } from "../schema/resolvers/generated/types";

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
  jwtSecret: string,
  provider: ethers.providers.BaseProvider
) {
  let SIWEObject = new SiweMessage(reqMessage);

  const code = await provider.getCode(SIWEObject.address);

  if (code === "0x") {
    const { data: message, success } = await SIWEObject.verify({
      signature,
      nonce,
    });

    if (success) {
      const expiryTimespan = message.expirationTime
        ? new Date(message.expirationTime).getTime() - Date.now()
        : 3600 * 2; // defaults to 2 hours
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
  } else {
    // Multisig wallet -- verify via Safe
    const validated = await validateSafeSignature(provider, {
      message: reqMessage,
      signature,
      signerAddress: SIWEObject.address,
    });

    if (validated) {
      const expiryTimespan = SIWEObject.expirationTime
        ? new Date(SIWEObject.expirationTime).getTime() - Date.now()
        : 3600 * 2; // defaults to 2 hours
      const expiry = Math.floor(Date.now() / 1000) + expiryTimespan;
      const secret = new TextEncoder().encode(jwtSecret);
      const jwtToken = await new SignJWT({
        address: validated.address,
        chainId: SIWEObject.chainId,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(expiry)
        .sign(secret);

      return { success: true, jwt: jwtToken, expiryTimespan };
    } else {
      return { success: false };
    }
  }
}

// ----------------
// Session
// ----------------

export async function verifySIWESession(token: string, jwtSecret: string) {
  const secret = new TextEncoder().encode(jwtSecret);
  return await jwtVerify(token, secret);
}

// ----------------
// Can Sign In
// ----------------

export async function isBadgeholder(
  address: string,
  reader: Reader<typeof entityDefinitions>
) {
  const citizen = (
    await collectGenerator(
      filterGenerator(
        reader.getEntitiesByIndex(
          "Badgeholder",
          "byRecipient",
          exactIndexValue(address)
        ),
        (entity) => !entity.value.revokedAtBlock
      )
    )
  )[0];

  const whitelist = await PrismaSingleton.instance.whitelist.findFirst({
    where: { address },
  });

  return !!citizen || !!whitelist;
}

export async function isTrezor(address: string) {
  const trezor = await PrismaSingleton.instance.trezors.findFirst({
    where: { address },
  });

  return !!trezor;
}
