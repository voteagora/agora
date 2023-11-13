import { StorageHandleForIndexer, makeEntityDefinition } from "../../process";
import * as serde from "../../serde";
import { RuntimeType } from "../../serde";
import { EASIndexer } from "../EAS";

export const aggregateKey = "AGGREGATE";

export const attestationAggregatesEntityDefinitions = {
  ApplicationsAggregate: makeEntityDefinition({
    serde: serde.object({
      total: serde.number,
      collectiveGovernance: serde.number,
      developerEcosystem: serde.number,
      endUserExperienceAndAdoption: serde.number,
      opStack: serde.number,
    }),
    indexes: [],
  }),

  ListsAggregate: makeEntityDefinition({
    serde: serde.object({
      total: serde.number,
      collectiveGovernance: serde.number,
      developerEcosystem: serde.number,
      endUserExperienceAndAdoption: serde.number,
      opStack: serde.number,
      pairwise: serde.number,
    }),
    indexes: [],
  }),
};

export async function updateApplicationsAggregate(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>,
  application: RuntimeType<
    typeof EASIndexer["entities"]["Application"]["serde"]
  >
) {
  const aggregate = await loadApplicationsAggregate(handle);
  aggregate.total += 1;
  application.impactCategory.forEach((category) => {
    switch (category) {
      case "COLLECTIVE_GOVERNANCE":
        aggregate.collectiveGovernance += 1;
        break;
      case "DEVELOPER_ECOSYSTEM":
        aggregate.developerEcosystem += 1;
        break;
      case "END_USER_EXPERIENCE_AND_ADOPTION":
        aggregate.endUserExperienceAndAdoption += 1;
        break;
      case "OP_STACK":
        aggregate.opStack += 1;
        break;
    }
  });
  handle.saveEntity("ApplicationsAggregate", aggregateKey, aggregate);
}

export async function updateApplicationsAggregateForRemoval(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>,
  application: RuntimeType<
    typeof EASIndexer["entities"]["Application"]["serde"]
  >
) {
  const aggregate = await loadApplicationsAggregate(handle);
  aggregate.total -= 1;
  application.impactCategory.forEach((category) => {
    switch (category) {
      case "COLLECTIVE_GOVERNANCE":
        aggregate.collectiveGovernance -= 1;
        break;
      case "DEVELOPER_ECOSYSTEM":
        aggregate.developerEcosystem -= 1;
        break;
      case "END_USER_EXPERIENCE_AND_ADOPTION":
        aggregate.endUserExperienceAndAdoption -= 1;
        break;
      case "OP_STACK":
        aggregate.opStack -= 1;
        break;
    }
  });
  handle.saveEntity("ApplicationsAggregate", aggregateKey, aggregate);
}

export async function loadApplicationsAggregate(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>
): Promise<
  RuntimeType<
    typeof attestationAggregatesEntityDefinitions["ApplicationsAggregate"]["serde"]
  >
> {
  const aggregate = await handle.loadEntity(
    "ApplicationsAggregate",
    aggregateKey
  );
  return (
    aggregate ?? {
      total: 0,
      collectiveGovernance: 0,
      developerEcosystem: 0,
      endUserExperienceAndAdoption: 0,
      opStack: 0,
    }
  );
}

export async function updateListsAggregate(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>,
  list: RuntimeType<typeof EASIndexer["entities"]["List"]["serde"]>
) {
  const aggregate = await loadListsAggregate(handle);
  aggregate.total += 1;
  list.categories.forEach((category) => {
    switch (category) {
      case "COLLECTIVE_GOVERNANCE":
        aggregate.collectiveGovernance += 1;
        break;
      case "DEVELOPER_ECOSYSTEM":
        aggregate.developerEcosystem += 1;
        break;
      case "END_USER_EXPERIENCE_AND_ADOPTION":
        aggregate.endUserExperienceAndAdoption += 1;
        break;
      case "OP_STACK":
        aggregate.opStack += 1;
        break;
      case "PAIRWISE":
        aggregate.pairwise += 1;
        break;
    }
  });
  handle.saveEntity("ListsAggregate", aggregateKey, aggregate);
}

export async function updateListsAggregateForRemoval(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>,
  list: RuntimeType<typeof EASIndexer["entities"]["List"]["serde"]>
) {
  const aggregate = await loadListsAggregate(handle);
  aggregate.total -= 1;
  list.categories.forEach((category) => {
    switch (category) {
      case "COLLECTIVE_GOVERNANCE":
        aggregate.collectiveGovernance -= 1;
        break;
      case "DEVELOPER_ECOSYSTEM":
        aggregate.developerEcosystem -= 1;
        break;
      case "END_USER_EXPERIENCE_AND_ADOPTION":
        aggregate.endUserExperienceAndAdoption -= 1;
        break;
      case "OP_STACK":
        aggregate.opStack -= 1;
        break;
      case "PAIRWISE":
        aggregate.pairwise -= 1;
        break;
    }
  });
  handle.saveEntity("ListsAggregate", aggregateKey, aggregate);
}

export async function loadListsAggregate(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>
): Promise<
  RuntimeType<
    typeof attestationAggregatesEntityDefinitions["ListsAggregate"]["serde"]
  >
> {
  const aggregate = await handle.loadEntity("ListsAggregate", aggregateKey);
  return (
    aggregate ?? {
      total: 0,
      collectiveGovernance: 0,
      developerEcosystem: 0,
      endUserExperienceAndAdoption: 0,
      opStack: 0,
      pairwise: 0,
    }
  );
}
