import { ethers } from "ethers";

import {
  DependenciesFromModuleDefinitions,
  ModuleDefinition,
} from "../schema/modules";
import { Prettify } from "../utils/unionToIntersection";

import { EntityDefinitions, Reader } from "./storage/reader/type";
import { EntityStore } from "./storage/entityStore/entityStore";
import { IndexerDefinition } from "./process/indexerDefinition";

export type ServerArgs<
  EntityDefinitionsType extends EntityDefinitions,
  ModuleDefinitions extends ReadonlyArray<ModuleDefinition<Record<string, any>>>
> = {
  store: EntityStore;
  provider: ethers.providers.JsonRpcProvider;
  makeContextFactory: (
    reader: Reader<EntityDefinitionsType>
  ) => () => Prettify<DependenciesFromModuleDefinitions<ModuleDefinitions>>;
} & DeploymentArgs<EntityDefinitionsType, ModuleDefinitions>;
export type DeploymentArgs<
  EntityDefinitionsType extends EntityDefinitions,
  ModuleDefinitions extends ReadonlyArray<ModuleDefinition<Record<string, any>>>
> = {
  indexers: IndexerDefinition[];
  entityDefinitions: EntityDefinitionsType;
  modules: ModuleDefinitions;
};

export function makeDeploymentArgs<
  EntityDefinitionsType extends EntityDefinitions,
  ModuleDefinitions extends ReadonlyArray<ModuleDefinition<Record<string, any>>>
>(
  args: DeploymentArgs<EntityDefinitionsType, ModuleDefinitions>
): DeploymentArgs<EntityDefinitionsType, ModuleDefinitions> {
  return args;
}
