import { DefaultArgs } from "@envelop/core";
import { Prisma } from "@prisma/client/edge";
import { compareBy } from "../indexer/utils/sortUtils";
import PrismaSingleton from "../store/prisma/client";

type Like = {
  listId: boolean;
};

type Likes = {
  [listId: string]: string[];
};

export type LikesService = {
  like({ listId, address }: { listId: string; address: string }): Promise<Like>;
  getLikes(listId: string): Promise<Likes>;
  getAllLikes(): Promise<Likes>;
};

export function makeLikesService(): LikesService {
  return {
    async like({ listId, address }: { listId: string; address: string }) {
      const result = await PrismaSingleton.instance.$queryRaw<
        Prisma.LikeGetPayload<DefaultArgs>[]
      >(
        Prisma.sql`
        INSERT INTO likes (id, addresses) 
        VALUES (${listId}, ARRAY[${address}::TEXT])
        ON CONFLICT (id)
        DO UPDATE 
        SET addresses = CASE 
            WHEN likes.addresses @> ARRAY[${address}::TEXT] THEN 
              array_remove(likes.addresses, ${address}::TEXT)
            ELSE 
              array_append(likes.addresses, ${address}::TEXT)
          END
        RETURNING *;
        `
      );

      const returnedLike = result[0];
      return { listId: returnedLike.addresses.includes(address) };
    },

    async getLikes(listId: string) {
      const like = await PrismaSingleton.instance.like.findUnique({
        where: { id: listId },
      });

      if (like) {
        return { [listId]: like.addresses };
      } else {
        return { [listId]: [] };
      }
    },

    async getAllLikes() {
      const likesData = await PrismaSingleton.instance.like.findMany();

      const likes: Likes = {};
      likesData.forEach((like) => {
        likes[like.id] = like.addresses;
      });

      return likes;
    },
  };
}

export type LikesStore = {
  getLikesForList(listId: string): Promise<string[]>;
  getLikesForAddress(address: string): Promise<string[]>;
  getAllLikesSortedDesc(): Promise<string[]>;
};

export function makeLikesStore(): LikesStore {
  return {
    async getLikesForList(listId: string) {
      const like = await PrismaSingleton.instance.like.findUnique({
        where: { id: listId },
      });

      if (like) {
        return like.addresses;
      } else {
        return [];
      }
    },

    async getLikesForAddress(address: string) {
      const likes = await PrismaSingleton.instance.like.findMany({
        where: { addresses: { has: address } },
      });

      return likes.map((like) => like.id);
    },

    async getAllLikesSortedDesc() {
      const likesData = await PrismaSingleton.instance.like.findMany();

      return likesData
        .sort(compareBy((it) => it.addresses.length))
        .map((like) => like.id);
    },
  };
}
