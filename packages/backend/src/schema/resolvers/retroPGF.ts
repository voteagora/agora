import { ethers, BigNumber } from "ethers";
import { entityDefinitions } from "../../indexer/contracts";
import { RuntimeType } from "../../indexer/serde";
import {
  collectGenerator,
  mapGenerator,
} from "../../indexer/utils/generatorUtils";
import { ApplicationResolvers, RetroPgfResolvers } from "./generated/types";

export type RetroPGFModel = {};

export const RetroPGF: RetroPgfResolvers = {
  async badgeholders(_parent, _args, { reader }) {
    const delegates = (
      await collectGenerator(
        reader.getEntitiesByIndex("Badgeholder", "byRecipient", {})
      )
    ).map(async (it) => {
      const delegate = await reader.getEntity("Address", it.value.recipient);
      if (!delegate) {
        return {
          address: it.value.recipient,
          tokensOwned: BigNumber.from(0),
          tokensRepresented: BigNumber.from(0),
          delegatingTo: ethers.constants.AddressZero,
          accountsRepresentedCount: BigNumber.from(0),
        };
      }
      return delegate;
    });

    return delegates;
  },

  applications(_parent, _args, { reader }) {
    return collectGenerator(
      mapGenerator(
        reader.getEntitiesByIndex("Application", "byDisplayName", {}),
        (it) => it.value
      )
    );
  },

  lists(_parent, _args, { reader }) {
    return collectGenerator(
      mapGenerator(
        reader.getEntitiesByIndex("List", "byDisplayName", {}),
        (it) => it.value
      )
    );
  },
};

export type ApplicationModel = RuntimeType<
  typeof entityDefinitions["Application"]["serde"]
>;

export const Application: ApplicationResolvers = {
  id({ uid }) {
    return uid;
  },
};

export type ListModel = RuntimeType<typeof entityDefinitions["List"]["serde"]>;

export const List: ApplicationResolvers = {
  id({ uid }) {
    return uid;
  },
};
