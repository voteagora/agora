import { ethers, BigNumber } from "ethers";
import seedrandom from "seedrandom";
import { entityDefinitions } from "../../indexer/contracts";
import { defaultAccount } from "../../indexer/contracts/GovernanceToken";
import { aggregateKey } from "../../indexer/contracts/utils/aggregates";
import {
  searchApplicationsByPrefix,
  searchTrieByPrefix,
} from "../../indexer/contracts/utils/search";
import { RuntimeType } from "../../indexer/serde";
import {
  EntityDefinitions,
  exactIndexValue,
  IndexedValue,
  Reader,
} from "../../indexer/storage/reader";
import { efficientLengthEncodingNaturalPositiveNumbers } from "../../indexer/utils/efficientLengthEncoding";
import {
  collectGenerator,
  filterGenerator,
  limitGenerator,
  mapGenerator,
} from "../../indexer/utils/generatorUtils";
import { compareBy } from "../../indexer/utils/sortUtils";
import { BallotsStore } from "../../services/ballot";
import { LikesStore } from "../../services/likes";
import { flipComparator } from "../../utils/sorting";
import {
  driveRandomReaderByIndex,
  driveReaderByIndex,
  paginateArray,
  paginateGenerator,
} from "../pagination";
import {
  ImpactMetricResolvers,
  ListOrder,
  ListResolvers,
  OptimistProfileResolvers,
  ProjectOrder,
  ProjectResolvers,
  RetroPgfResolvers,
} from "./generated/types";

export type RetroPGFModel = {};

export const RetroPGF: RetroPgfResolvers = {
  async badgeholders(_parent, { orderBy }, { reader }) {
    const citizens = await collectGenerator(
      mapGenerator(
        reader.getEntitiesByIndex("Badgeholder", "byRecipient", {}),
        async (it) => {
          const delegate = await reader.getEntity(
            "Address",
            it.value.recipient
          );
          if (!delegate) {
            return {
              address: it.value.recipient,
              tokensOwned: BigNumber.from(0),
              tokensRepresented: BigNumber.from(0),
              delegatingTo: ethers.constants.AddressZero,
              accountsRepresentedCount: BigNumber.from(0),
              isCitizen: false,
            };
          }
          return delegate;
        }
      )
    );

    const sortedCitizens = citizens.slice().sort(
      (() => {
        switch (orderBy) {
          case "mostVotingPower":
            return flipComparator(
              compareBy((it) => it.tokensRepresented.toBigInt())
            );

          case "shuffle":
            return () => Math.random() - 0.5;
        }
      })()
    );

    return sortedCitizens;
  },

  async projects(
    _parent,
    { search, category, orderBy, first, after, skip, seed },
    { reader, ballotsStore }
  ) {
    const filterFn = (
      it: IndexedValue<
        Readonly<
          RuntimeType<typeof entityDefinitions["ApprovedApplication"]["serde"]>
        >
      >
    ) =>
      !it.value.supersededBy &&
      !it.value.revokedAtBlock &&
      (!category ||
        category.length === 0 ||
        category.every((cat) => it.value.impactCategory.includes(cat)));

    if (search) {
      return paginateGenerator(
        filterGenerator(readProjectsWithSearch(reader, search), filterFn),
        first,
        after ?? null,
        skip ?? 0
      );
    }

    if (orderBy === ProjectOrder.Shuffle) {
      const projects = (
        await collectGenerator(
          filterGenerator(
            reader.getEntitiesByIndex("ApprovedApplication", "byRecipient", {}),
            filterFn
          )
        )
      ).map((it) => it.value);

      return paginateArray(
        shuffleArray(projects, seed ?? Date.now().toString()),
        first,
        after ?? null,
        skip ?? 0
      );
    }

    if (orderBy === ProjectOrder.ByIncludedInBallots) {
      return paginateGenerator(
        filterGenerator(
          readProjectsByIncludedInBallots(reader, ballotsStore),
          filterFn
        ),
        first,
        after ?? null,
        skip ?? 0
      );
    }

    return driveReaderByIndex(
      reader,
      "ApprovedApplication",
      (() => {
        switch (orderBy) {
          case ProjectOrder.AlphabeticalAz:
            return "byNameAZ";
          case ProjectOrder.AlphabeticalZa:
            return "byNameZA";
        }
      })(),
      first,
      after ?? null,
      skip ?? 0,
      undefined,
      filterFn
    );
  },

  project(_parent, { id }, { reader }) {
    return reader.getEntity("ApprovedApplication", id);
  },

  async projectsAggregate(_parent, _args, { reader }) {
    return (
      (await reader.getEntity("ApplicationsAggregate", aggregateKey)) ?? {
        total: 0,
        collectiveGovernance: 0,
        developerEcosystem: 0,
        endUserExperienceAndAdoption: 0,
        opStack: 0,
      }
    );
  },

  async lists(
    _parent,
    { search, category, likedBy, orderBy, first, after, skip, seed },
    { reader, likesStore }
  ) {
    const likes: string[] = [];
    if (likedBy) {
      likes.push(...(await likesStore.getLikesForAddress(likedBy)));
    }

    const filterFn = (
      it: IndexedValue<
        Readonly<RuntimeType<typeof entityDefinitions["List"]["serde"]>>
      >
    ) => {
      if (likedBy) {
        return (
          !it.value.revokedAtBlock &&
          likes.includes(it.entityId) &&
          (!category ||
            category.length === 0 ||
            category.some((cat) => it.value.categories.includes(cat)))
        );
      }
      return (
        !it.value.revokedAtBlock &&
        (!category ||
          category.length === 0 ||
          category.every((cat) => it.value.categories.includes(cat))) &&
        Number(it.value.blockNumber) > 111837305
      );
    };

    if (search) {
      return paginateGenerator(
        filterGenerator(readListsWithSearch(reader, search), filterFn),
        first,
        after ?? null,
        skip ?? 0
      );
    }

    if (orderBy === ListOrder.Shuffle) {
      const lists = (
        await collectGenerator(
          filterGenerator(
            reader.getEntitiesByIndex("List", "byBlockNumber", {}),
            filterFn
          )
        )
      ).map((it) => it.value);

      return paginateArray(
        shuffleArray(lists, seed ?? Date.now().toString()),
        first,
        after ?? null,
        skip ?? 0
      );
    }

    if (orderBy === ListOrder.ByLikes) {
      return paginateGenerator(
        filterGenerator(readListsByLikes(reader, likesStore), filterFn),
        first,
        after ?? null,
        skip ?? 0
      );
    }

    return driveReaderByIndex(
      reader,
      "List",
      (() => {
        switch (orderBy) {
          case ListOrder.AlphabeticalAz:
            return "byNameAZ";
          case ListOrder.AlphabeticalZa:
            return "byNameZA";
        }
      })(),
      first,
      after ?? null,
      skip ?? 0,
      undefined,
      filterFn
    );
  },

  list(_parent, { id }, { reader }) {
    return reader.getEntity("List", id);
  },

  async listsAggregate(_parent, _args, { reader }) {
    return (
      (await reader.getEntity("ListsAggregate", aggregateKey)) ?? {
        total: 0,
        collectiveGovernance: 0,
        developerEcosystem: 0,
        endUserExperienceAndAdoption: 0,
        opStack: 0,
        pairwise: 0,
      }
    );
  },
};

export type ProjectModel = RuntimeType<
  typeof entityDefinitions["ApprovedApplication"]["serde"]
>;

export const Project: ProjectResolvers = {
  id({ uid }) {
    return uid;
  },
  async applicant({ recipient }, _, { reader }) {
    return (
      (await reader.getEntity("Address", recipient)) ??
      defaultAccount(recipient)
    );
  },
  payoutAddress({ payoutAddress }) {
    return { address: payoutAddress };
  },
  includedInBallots({ uid }, _, { ballotsStore }) {
    return ballotsStore.getBallotsCountForProject(uid);
  },
  lists({ lists }, _, { reader }) {
    return collectGenerator(
      filterGenerator(readListsByIds(reader, lists), (it) => !it.revokedAtBlock)
    );
  },
  async profile({ recipient }, _, { reader }) {
    const result = (
      await collectGenerator(
        filterGenerator(
          reader.getEntitiesByIndex(
            "OptimistProfile",
            "byRecipient",
            exactIndexValue(recipient)
          ),
          (it) => !it.value.supersededBy && !it.value.revokedAtBlock
        )
      )
    ).sort(compareBy((it) => it.value.blockNumber.toBigInt()));
    return result[0]?.value ?? null;
  },
};

export const ImpactMetric: ImpactMetricResolvers = {
  number({ number }) {
    return number;
  },
};

export type OptimistProfileModel = RuntimeType<
  typeof entityDefinitions["OptimistProfile"]["serde"]
>;

export const OptimistProfile: OptimistProfileResolvers = {
  id({ uid }) {
    return uid;
  },
};

export type ListModel = RuntimeType<typeof entityDefinitions["List"]["serde"]>;

export const List: ListResolvers = {
  id({ uid }) {
    return uid;
  },
  author({ recipient }) {
    return { address: recipient };
  },
  async listContentCount({ listContent }) {
    return listContent.length;
  },
  async listContentShort({ listContent }, _, { reader }) {
    const resolvedContent = [];
    for await (const item of listContent.slice(0, 12)) {
      const project = await reader.getEntity(
        "ApprovedApplication",
        item.RPGF3_Application_UID
      );
      if (project) {
        resolvedContent.push({
          project: project,
          OPAmount: item.OPAmount,
        });
      }
    }
    return resolvedContent;
  },
  async listContent({ listContent }, _, { reader }) {
    const resolvedContent = [];
    for await (const item of listContent) {
      const project = await reader.getEntity(
        "ApprovedApplication",
        item.RPGF3_Application_UID
      );
      if (project) {
        resolvedContent.push({
          project: project,
          OPAmount: item.OPAmount,
        });
      }
    }
    return resolvedContent;
  },
  categories({ categories }) {
    return categories;
  },
  async likes({ uid }, _, { likesStore }) {
    return likesStore.getLikesForList(uid);
  },
};

async function* readProjectsWithSearch<
  EntityDefinitionsType extends EntityDefinitions
>(
  reader: Reader<EntityDefinitionsType>,
  search: string
): AsyncGenerator<
  RuntimeType<EntityDefinitions["ApprovedApplication"]["serde"]>
> {
  const entityIds = await searchApplicationsByPrefix(reader, search);
  for (const entityId of entityIds) {
    const result = await reader.getEntity("ApprovedApplication", entityId);
    if (result) {
      yield {
        indexKey: "search",
        entityId,
        value: result,
      };
    }
  }
}

async function* readListsWithSearch<
  EntityDefinitionsType extends EntityDefinitions
>(
  reader: Reader<EntityDefinitionsType>,
  search: string
): AsyncGenerator<RuntimeType<EntityDefinitions["List"]["serde"]>> {
  const entityIds = await searchTrieByPrefix(reader, "ListsSearchTrie", search);
  for (const entityId of entityIds) {
    const result = await reader.getEntity("List", entityId);
    if (result) {
      yield {
        indexKey: "search",
        entityId,
        value: result,
      };
    }
  }
}

async function* readListsByLikes(
  reader: Reader<typeof entityDefinitions>,
  likesStore: LikesStore
): AsyncGenerator<
  IndexedValue<RuntimeType<typeof entityDefinitions["List"]["serde"]>>
> {
  const likes = await likesStore.getAllLikesSortedDesc();

  const likesSet = new Set(likes);

  const unlikedLists = mapGenerator(
    filterGenerator(
      reader.getEntitiesByIndex("List", "byBlockNumber", {}),
      (it) => !likesSet.has(it.entityId)
    ),
    (it) => {
      return {
        indexKey: "byLikes",
        entityId: it.entityId,
        value: it.value,
      };
    }
  );

  for await (const list of unlikedLists) {
    yield list;
  }

  for (const listId of likes) {
    const list = await reader.getEntity("List", listId);
    if (list) {
      yield {
        indexKey: "byLikes",
        entityId: listId,
        value: list,
      };
    }
  }
}

async function* readProjectsByIncludedInBallots(
  reader: Reader<typeof entityDefinitions>,
  ballotsStore: BallotsStore
): AsyncGenerator<
  IndexedValue<
    RuntimeType<typeof entityDefinitions["ApprovedApplication"]["serde"]>
  >
> {
  const projects = await ballotsStore.getSortedProjectsFromBallots();

  const projectsSet = new Set(projects);

  const nonVotedProjects = mapGenerator(
    filterGenerator(
      reader.getEntitiesByIndex("ApprovedApplication", "byBlockNumber", {}),
      (it) => !projectsSet.has(it.entityId)
    ),
    (it) => {
      return {
        indexKey: "byIncludedInBallots",
        entityId: it.entityId,
        value: it.value,
      };
    }
  );

  for await (const project of nonVotedProjects) {
    yield project;
  }

  for (const projectId of projects) {
    const project = await reader.getEntity("ApprovedApplication", projectId);
    if (project) {
      yield {
        indexKey: "byIncludedInBallots",
        entityId: project.uid,
        value: project,
      };
    }
  }
}

async function* readListsByIds(
  reader: Reader<typeof entityDefinitions>,
  listIds: string[]
): AsyncGenerator<RuntimeType<typeof entityDefinitions["List"]["serde"]>> {
  for (const listId of listIds) {
    const list = await reader.getEntity("List", listId);
    if (list) {
      yield list;
    }
  }
}

function shuffleArray(array: any[], seed: string) {
  const rng = seedrandom(seed);
  let m = array.length,
    t,
    i;

  // Fisher-Yates shuffle algorithm
  while (m) {
    i = Math.floor(rng() * m--);

    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}
