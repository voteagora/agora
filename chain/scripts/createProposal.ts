import { ethers } from "hardhat";
import { NounsDAOLogicV2__factory } from "./generated";
import dedent from "dedent";
import { constants } from "@agora/common/src/constants";

async function main() {
  const signer = await ethers.getImpersonatedSigner(
    "0x0C66d954d9cb1ebDF4E37a000262323C83655e70"
  );

  const daoContract = NounsDAOLogicV2__factory.connect(
    constants("dev").nounsDao.address,
    signer
  );

  const tx = await daoContract.propose(
    [ethers.constants.AddressZero],
    [0],
    ["0x"],
    ["0x"],
    dedent`
        # test proposal
  
        hello world!!
      `
  );

  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
