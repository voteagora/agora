import { ethers } from "ethers";
import { EAS__factory } from "../../contracts/generated";

export type EASDataFetcher = {
  getEASData: (uid: string) => Promise<string>;
};

export function easDataFetcher(
  provider: ethers.providers.BaseProvider
): EASDataFetcher {
  return {
    getEASData: async (uid: string) => {
      const easContract = EAS__factory.connect(
        "0x4200000000000000000000000000000000000021",
        provider
      );

      return (await easContract.getAttestation(uid)).data;
    },
  };
}
