import { EntityRuntimeType } from "../../shared/indexer/process/process";
import { IVotesAddress } from "../../shared/contracts/indexers/ERC20Votes/entities/address";

export type AccountLoader<
  AddressType extends EntityRuntimeType<typeof IVotesAddress>
> = {
  loadAccount(address: string): Promise<AddressType>;
};
