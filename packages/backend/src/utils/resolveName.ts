import { ethers } from "ethers";

import {
  ENSAddressResolver__factory,
  ENSRegistryWithFallback,
  ENSRegistryWithFallback__factory,
  NNSENSReverseResolver__factory,
} from "../contracts/generated";

export async function resolveNameFromAddress(
  address: string,
  provider: ethers.providers.Provider
): Promise<string | null> {
  const resolver = NNSENSReverseResolver__factory.connect(
    "0x5982cE3554B18a5CF02169049e81ec43BFB73961",
    provider
  );

  const resolved = await resolver.resolve(address);
  if (!resolved) {
    return null;
  }

  const forwardResolvedAddress = await resolveEnsOrNnsName(resolved, provider);

  if (address.toLowerCase() !== forwardResolvedAddress?.toLowerCase()) {
    return null;
  }

  return resolved;
}

export async function resolveEnsOrNnsName(
  name: string,
  provider: ethers.providers.Provider
): Promise<string | null> {
  if (name.endsWith(".⌐◨-◨")) {
    return resolveName(
      name,
      ENSRegistryWithFallback__factory.connect(
        "0x3e1970dC478991b49c4327973eA8A4862eF5A4DE",
        provider
      )
    );
  } else {
    return resolveName(
      name,
      ENSRegistryWithFallback__factory.connect(
        "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        provider
      )
    );
  }
}

async function resolveName(
  nameOrAddress: string,
  registry: ENSRegistryWithFallback
): Promise<string | null> {
  if (ethers.utils.isHexString(nameOrAddress)) {
    return ethers.utils.getAddress(nameOrAddress);
  }

  const name = nameOrAddress;
  const resolverAddress = await getResolver(name, registry);
  if (!resolverAddress) {
    return null;
  }

  const resolver = ENSAddressResolver__factory.connect(
    resolverAddress,
    registry.provider
  );

  const hash = ethers.utils.namehash(name);
  return await resolver.addr(hash);
}

async function getResolver(
  name: string,
  registry: ENSRegistryWithFallback
): Promise<string | null> {
  const nameParts = name.split(".");
  for (let i = 0; i < nameParts.length; i++) {
    const subname = nameParts.slice(i).join(".");

    if (name != "eth" && subname === "eth") {
      return null;
    }

    if (subname === "") {
      return null;
    }

    const hash = ethers.utils.namehash(subname);
    const resolvedAddress = await registry.resolver(hash);
    if (resolvedAddress !== ethers.constants.AddressZero) {
      return resolvedAddress;
    }
  }

  return null;
}
