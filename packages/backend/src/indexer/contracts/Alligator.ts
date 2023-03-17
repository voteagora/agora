import { makeIndexerDefinition } from "../process";
import { makeContractInstance } from "../../contracts";
import { Alligator__factory } from "../../contracts/generated";

import { RuntimeType } from "../serde";
import { RulesStructOutput } from "../../contracts/generated/Alligator";

import { entityDefinitions } from "./entityDefinitions";

export const alligatorContract = makeContractInstance({
  iface: Alligator__factory.createInterface(),
  address: "0x57aa7DeD5187C423AD8B3bd5c91f2211cD97b2A3",
  startingBlock: 16750535,
});

export const alligatorIndexer = makeIndexerDefinition(
  alligatorContract,
  entityDefinitions,
  {
    name: "Alligator",
    eventHandlers: [
      {
        signature: "ProxyDeployed(address,address)",
        handle(handle, event) {
          handle.saveEntity("AlligatorProxy", event.args.proxy, {
            owner: event.args.owner,
            proxy: event.args.proxy,
          });
        },
      },
      {
        signature:
          "SubDelegations(address,address[],(uint8,uint8,uint32,uint32,uint16,address)[])",
        handle(handle, event) {
          for (const [idx, to] of event.args.to.entries()) {
            handle.saveEntity(
              "AlligatorSubDelegation",
              [event.args.from, to].join("-"),
              {
                from: event.args.from,
                to,
                rules: toRules(event.args.rules[idx]),
              }
            );
          }
        },
      },
      {
        signature:
          "SubDelegation(address,address,(uint8,uint8,uint32,uint32,uint16,address))",
        handle(handle, event) {
          handle.saveEntity(
            "AlligatorSubDelegation",
            [event.args.from, event.args.to].join("-"),
            {
              from: event.args.from,
              to: event.args.to,
              rules: toRules(event.args.rules),
            }
          );
        },
      },
    ],
  }
);

function toRules(
  rules: RulesStructOutput
): RuntimeType<
  typeof entityDefinitions["AlligatorSubDelegation"]["serde"]
>["rules"] {
  return {
    permissions: rules.permissions,
    maxRedelegations: rules.maxRedelegations,
    customRule: rules.customRule,
    blocksBeforeVoteCloses: rules.blocksBeforeVoteCloses,
    notValidAfter: rules.notValidAfter,
    notValidBefore: rules.notValidBefore,
  };
}
