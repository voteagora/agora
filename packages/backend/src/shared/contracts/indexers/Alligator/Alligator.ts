import {
  AbiEventsMapping,
  ContractInstance,
} from "../../../indexer/process/contractInstance";
import { makeIndexerDefinition } from "../../../indexer";

import { AlligatorAbi } from "./AlligatorAbi";
import { toRules } from "./entities/rules";
import {
  alligatorEntityDefinitions,
  storeSubdelegation,
} from "./entities/entities";

export function makeAlligatorIndexer(
  contract: ContractInstance<AbiEventsMapping<typeof AlligatorAbi>>,
  name: string
) {
  return makeIndexerDefinition(contract, alligatorEntityDefinitions, {
    name,
    eventHandlers: {
      ProxyDeployed: {
        handle(handle, [owner, proxy]) {
          handle.saveEntity("AlligatorProxy", proxy, {
            owner,
            proxy,
          });
        },
      },
      SubDelegations: {
        handle(handle, [from, tos, rules]) {
          for (const [idx, to] of tos.entries()) {
            storeSubdelegation(handle, from, to, toRules(rules[idx]));
          }
        },
      },
      SubDelegation: {
        handle(handle, [from, to, rules]) {
          storeSubdelegation(handle, from, to, toRules(rules));
        },
      },
    },
  });
}
