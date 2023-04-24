import { makeContractInstance } from "@agora/common";

import { zoraAuctionHouseAbi } from "./zoraAuctionHouseAbi";

export const zoraAuctionHouse = makeContractInstance({
  abi: zoraAuctionHouseAbi,
  address: "0xE468cE99444174Bd3bBBEd09209577d25D1ad673",
  startingBlock: 12372205,
});
