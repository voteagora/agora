import {
  formSchema,
  initialFields,
  GOVPOOL_CONTRACT_ADDRESS,
} from "@agora/common";

import { Resolvers } from "../module";

export const Delegate: Resolvers["Delegate"] = {
  async statement({ address }, _args, { reader, statementStorage }) {
    if (address === GOVPOOL_CONTRACT_ADDRESS) {
      return {
        address: address,
        values: formSchema.parse({
          ...initialFields(),
          delegateStatement: GOVPOOL_STATEMENT,
        }),
      };
    }

    const proxy = await reader.getEntity("AlligatorProxy", address);

    if (proxy) {
      return {
        address: address,
        values: formSchema.parse({
          ...initialFields(),
          delegateStatement: PROXY_STATEMENT,
        }),
      };
    }

    const statement = await statementStorage.getStatement(address);
    if (!statement) {
      return null;
    }

    return {
      address: address,
      values: formSchema.parse(JSON.parse(statement.signedPayload)),
    };
  },
};

const PROXY_STATEMENT =
  "This profile was automatically generated for a smart contract proxy that holds delegated votes. This address exists to give more flexibility to voters and delegates who wish to exercise more fine-grained control over their delegation.\n\nYou can view this profile to understand more about this contract address, but please do not delegate to it unless you wish to give your votes to the controller(s) of this address.";

const GOVPOOL_STATEMENT =
  "This profile was automatically generated for a smart contract proxy that holds delegated votes. Noun holders can delegate their Noun(s) to a governance pool. The collective voting power of the pool is then auctioned off to the highest bidder. Those who delegate to a governance pool earn rewards from each auction in proportion to the amount of votes they own / total pool size. This is possible through the use of ZKProofs and as a result no asset staking or registration is required to join a pool. Auctions for governance pools end at a fixed time so that votes are always cast before a voting period ends. If a vote could not be cast in time, the highest bidder can claim a full refund. If a vote is cast but the proposal is then canceled or vetoed, the highest bidder can claim a partial refund (minus fees + gas refunds + tips):";
