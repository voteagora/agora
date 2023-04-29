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
  contextFactory: (
    reader: Reader<EntityDefinitionsType>
  ) => Prettify<DependenciesFromModuleDefinitions<ModuleDefinitions>>;

  /**
   * Disable finalization of blocks. New blocks will be processed, but updates
   * will not be finalized to {@link store}. Useful for testing where you want
   * to repeatedly restart real-time indexing from a specific point in time.
   */
  finalizationDisabled?: boolean;
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
