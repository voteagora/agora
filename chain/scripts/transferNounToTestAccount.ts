import { ethers } from "hardhat";
import { NounsToken__factory } from "./generated";
import { constants } from "@agora/common/src/constants";

async function main() {
  const noun12Address = "0x008c84421dA5527F462886cEc43D2717B686A7e4";

  const testAccountAddress = "0x648BFC4dB7e43e799a84d0f607aF0b4298F932DB";

  const signer = await ethers.getImpersonatedSigner(noun12Address);

  const nounsToken = NounsToken__factory.connect(
    constants("dev").nounsToken.address,
    signer
  );

  await nounsToken.transferFrom(noun12Address, testAccountAddress, "156");
  await nounsToken.transferFrom(noun12Address, testAccountAddress, "12");
  await nounsToken.transferFrom(noun12Address, testAccountAddress, "224");
  await nounsToken.transferFrom(noun12Address, testAccountAddress, "649");
  await nounsToken.transferFrom(noun12Address, testAccountAddress, "24");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
