import { ethers } from "hardhat";
import { NounsToken__factory } from "./generated";

async function main() {
  const noun12Address = "0x008c84421dA5527F462886cEc43D2717B686A7e4";

  const testAccountAddress = "0x648BFC4dB7e43e799a84d0f607aF0b4298F932DB";

  const signer = await ethers.getImpersonatedSigner(noun12Address);

  const nounsToken = NounsToken__factory.connect(
    "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03",
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
