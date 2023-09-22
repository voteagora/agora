import { DefaultArgs } from "@envelop/core";
import { Prisma } from "@prisma/client/edge";
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
