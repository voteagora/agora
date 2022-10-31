import { ethers } from "ethers";
import {
  ENSAddressResolver__factory,
  ENSRegistryWithFallback,
  ENSRegistryWithFallback__factory,
} from "../contracts/generated";

export async function resolveEnsName(
  name: string,
  provider: ethers.providers.Provider
) {
  return resolveName(
    name,
    ENSRegistryWithFallback__factory.connect(
      "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
      provider
    )
  );
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
