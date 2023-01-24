import { ethers } from "ethers";
import {
  ENSNameResolver__factory,
  ENSAddressResolver__factory,
  ENSRegistryWithFallback,
  ENSRegistryWithFallback__factory,
} from "../contracts/generated";

function makeEnsRegistry(provider: ethers.providers.Provider) {
  return ENSRegistryWithFallback__factory.connect(
    "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    provider
  );
}

async function resolveAddress(
  address: string,
  provider: ethers.providers.Provider
) {
  const registry = makeEnsRegistry(provider);

  const reverseRecordName =
    address.toLowerCase().replace("0x", "") + ".addr.reverse";

  const resolverAddress = await getResolver(reverseRecordName, registry);
  if (!resolverAddress) {
    return null;
  }

  const resolver = ENSNameResolver__factory.connect(resolverAddress, provider);

  const hash = ethers.utils.namehash(reverseRecordName);
  return await resolver.name(hash);
}

export async function resolveNameFromAddress(
  address: string,
  provider: ethers.providers.BaseProvider
) {
  const resolvedName = await resolveAddress(address, provider);
  if (!resolvedName) {
    return null;
  }

  const resolvedAddress = await resolveEnsName(resolvedName, provider);
  if (!resolvedAddress) {
    return null;
  }

  if (resolvedAddress.toLowerCase() !== address.toLowerCase()) {
    return null;
  }

  return resolvedName;
}

export async function resolveEnsName(
  name: string,
  provider: ethers.providers.BaseProvider
) {
  const resolver = await provider.getResolver(name);
  if (!resolver) {
    return null;
  }

  return await resolver.getAddress();
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
