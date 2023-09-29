import { ethers, BigNumber } from "ethers";
import seedrandom from "seedrandom";
import { entityDefinitions } from "../../indexer/contracts";
import { EASIndexer } from "../../indexer/contracts/EAS";
import {
  aggregateKey,
  loadApplicationsAggregate,
  loadListsAggregate,
} from "../../indexer/contracts/utils/aggregates";
import { searchByPrefix } from "../../indexer/contracts/utils/search";
import { RuntimeType } from "../../indexer/serde";
import {
  EntityDefinitions,
  IndexedValue,
  Reader,
} from "../../indexer/storage/reader";
import { efficientLengthEncodingNaturalPositiveNumbers } from "../../indexer/utils/efficientLengthEncoding";
import {
  collectGenerator,
  filterGenerator,
} from "../../indexer/utils/generatorUtils";
import { BallotsStore } from "../../services/ballot";
import { LikesStore } from "../../services/likes";
import {
  driveRandomReaderByIndex,
  driveReaderByIndex,
  paginateGenerator,
} from "../pagination";
import {
  ListOrder,
  ListResolvers,
  ProjectOrder,
  ProjectResolvers,
  RetroPgfResolvers,
} from "./generated/types";

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
          isCitizen: false,
        };
      }
      return delegate;
    });

    return delegates;
  },

  async projects(
    _parent,
    { search, category, orderBy, first, after, seed },
    { reader, ballotsStore }
  ) {
    const filterFn = (
      it: IndexedValue<
        Readonly<RuntimeType<typeof entityDefinitions["Application"]["serde"]>>
      >
    ) => !category || it.value.impactCategory.includes(category);

    if (search) {
      return paginateGenerator(
        filterGenerator(
          readEntitiesWithSearch(reader, "Application", search),
          filterFn
        ),
        first,
        after ?? null
      );
    }

    if (orderBy === ProjectOrder.Shuffle) {
      const latestBlock = await reader.getLatestBlock();
      const randomStartCursor = async () => {
        const startBlock = Math.floor(
          seedrandom(seed ?? Date.now().toString())() *
            (latestBlock.blockNumber - EASIndexer.startingBlock + 1) +
            EASIndexer.startingBlock
        );
        return efficientLengthEncodingNaturalPositiveNumbers(
          BigNumber.from(startBlock)
        );
      };

      const projects = await driveRandomReaderByIndex(
        reader,
        "Application",
        "byBlockNumber",
        first,
        after ?? (await randomStartCursor()),
        seed ?? Date.now().toString(),
        undefined,
        filterFn
      );

      // point the cursor to back to the beginning if we are at the end
      if (!projects.pageInfo.hasNextPage) {
        projects.pageInfo.endCursor =
          efficientLengthEncodingNaturalPositiveNumbers(
            BigNumber.from(latestBlock)
          );
      }

      return projects;
    }

    if (orderBy === ProjectOrder.ByIncludedInBallots) {
      return paginateGenerator(
        filterGenerator(
          readProjectsByIncludedInBallots(reader, ballotsStore),
          filterFn
        ),
        first,
        after ?? null
      );
    }

    return driveReaderByIndex(
      reader,
      "Application",
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
      undefined,
      filterFn
    );
  },

  project(_parent, { id }, { reader }) {
    return reader.getEntity("Application", id);
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
    { search, category, likedBy, orderBy, first, after, seed },
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
          likes.includes(it.entityId) &&
          (!category || it.value.categories.includes(category))
        );
      }
      return !category || it.value.categories.includes(category);
    };

    if (search) {
      return paginateGenerator(
        filterGenerator(
          readEntitiesWithSearch(reader, "List", search),
          filterFn
        ),
        first,
        after ?? null
      );
    }

    if (orderBy === ListOrder.Shuffle) {
      const latestBlock = await reader.getLatestBlock();
      const randomStartCursor = async () => {
        const startBlock = Math.floor(
          seedrandom(seed ?? Date.now().toString())() *
            (latestBlock.blockNumber - EASIndexer.startingBlock + 1) +
            EASIndexer.startingBlock
        );
        return efficientLengthEncodingNaturalPositiveNumbers(
          BigNumber.from(startBlock)
        );
      };

      const lists = await driveRandomReaderByIndex(
        reader,
        "List",
        "byBlockNumber",
        first,
        after ?? (await randomStartCursor()),
        seed ?? Date.now().toString(),
        undefined,
        filterFn
      );

      // point the cursor to back to the beginning if we are at the end
      if (!lists.pageInfo.hasNextPage) {
        lists.pageInfo.endCursor =
          efficientLengthEncodingNaturalPositiveNumbers(
            BigNumber.from(latestBlock)
          );
      }

      return lists;
    }

    if (orderBy === ListOrder.ByLikes) {
      return paginateGenerator(
        filterGenerator(readListsByLikes(reader, likesStore), filterFn),
        first,
        after ?? null
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
      }
    );
  },
};

export type ProjectModel = RuntimeType<
  typeof entityDefinitions["Application"]["serde"]
>;

export const Project: ProjectResolvers = {
  id({ uid }) {
    return uid;
  },
};

export type ListModel = RuntimeType<typeof entityDefinitions["List"]["serde"]>;

export const List: ListResolvers = {
  id({ uid }) {
    return uid;
  },
  async listContent({ listContent }, _, { reader }) {
    const resolvedContent = [];
    for await (const item of listContent) {
      const project = await reader.getEntity(
        "Application",
        item.RPGF3_Application_UID
      );
      if (project) {
        resolvedContent.push({
          project,
          OPAmount: item.OPAmount,
        });
      }
    }
    return resolvedContent;
  },
  async likes({ uid }, _, { likesStore }) {
    return likesStore.getLikesForList(uid);
  },
};

async function* readEntitiesWithSearch<
  EntityDefinitionsType extends EntityDefinitions,
  EntityName extends "Application" | "List"
>(
  reader: Reader<EntityDefinitionsType>,
  entityName: EntityName,
  search: string
): AsyncGenerator<RuntimeType<EntityDefinitions[EntityName]["serde"]>> {
  const entityIds = await searchByPrefix(reader, entityName, search);
  for (const entityId of entityIds) {
    const result = await reader.getEntity(entityName, entityId);
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

  for (const listId in likes) {
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
  IndexedValue<RuntimeType<typeof entityDefinitions["Application"]["serde"]>>
> {
  const projects = await ballotsStore.getSortedProjectsFromBallots();

  for (const projectId of projects) {
    const project = await reader.getEntity("Application", projectId);
    if (project) {
      yield {
        indexKey: "byIncludedInBallots",
        entityId: projectId,
        value: project,
      };
    }
  }
}
