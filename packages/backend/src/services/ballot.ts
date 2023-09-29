import { ethers } from "ethers";
import { z } from "zod";
import { DefaultArgs } from "@envelop/core";
import { Prisma } from "@prisma/client";
import PrismaSingleton from "../store/prisma/client";
import { validateSigned } from "../utils/signing";
import { compareBy } from "../indexer/utils/sortUtils";

type Ballot = {
  address: string;
  createdAt: Date;
  updatedAt: Date | null;
  publishedAt: Date | null;
  votes: Vote[];
};

type Vote = {
  projectId: string;
  amount: string;
};

type Submission = {
  success: boolean;
  address: string;
  timestamp: Date;
  error?: {
    code: number;
    message: string;
  };
};

export type BallotsService = {
  getBallot(address: string): Promise<Ballot>;
  saveBallot(address: string, votes: Vote[]): Promise<Ballot>;
  submitBallot(
    address: string,
    votes: Vote[],
    signature: string,
    provider: ethers.providers.BaseProvider
  ): Promise<Submission>;
};

export function makeBallotService(): BallotsService {
  return {
    async getBallot(address: string): Promise<Ballot> {
      const ballot = await PrismaSingleton.instance.ballot.findUnique({
        where: { address },
      });

      if (ballot) {
        return toBallotType(ballot);
      } else {
        return toBallotType(
          await PrismaSingleton.instance.ballot.create({
            data: { address },
          })
        );
      }
    },

    async saveBallot(address: string, votes: Vote[]): Promise<Ballot> {
      return toBallotType(
        await PrismaSingleton.instance.ballot.upsert({
          where: { address },
          update: {
            votes: votes,
            updatedAt: new Date(),
          },
          create: {
            address,
            votes,
          },
        })
      );
    },

    async submitBallot(
      address: string,
      votes: Vote[],
      signature: string,
      provider: ethers.providers.BaseProvider
    ): Promise<Submission> {
      // Verify signature
      try {
        const code = await provider.getCode(address);

        await validateSigned(provider, {
          signerAddress: address,
          value: JSON.stringify(votes, undefined, "\t"),
          signature,
          signatureType: code === "0x" ? "EOA" : ("CONTRACT" as any),
        });
      } catch (error) {
        return {
          success: false,
          address,
          timestamp: new Date(),
          error: {
            code: 401,
            message: "Invalid signature",
          },
        };
      }

      const existingBallot = await PrismaSingleton.instance.ballot.findFirst({
        where: {
          address,
        },
      });

      if (!existingBallot || !existingBallot.signature) {
        const ballot = await PrismaSingleton.instance.ballot.upsert({
          where: {
            address,
          },
          update: {
            signature,
            votes,
            updatedAt: new Date(),
            publishedAt: new Date(),
          },
          create: {
            address,
            votes,
            signature,
            updatedAt: new Date(),
            publishedAt: new Date(),
          },
        });

        if (ballot) {
          return {
            success: true,
            address,
            timestamp: new Date(),
          };
        }

        return {
          success: false,
          address,
          timestamp: new Date(),
          error: {
            code: 500,
            message: "Internal Server Error",
          },
        };
      } else {
        return {
          success: false,
          address,
          timestamp: new Date(),
          error: {
            code: 409,
            message: "Already voted",
          },
        };
      }
    },
  };
}

function toBallotType(
  prismaBallot: Prisma.BallotGetPayload<DefaultArgs>
): Ballot {
  return {
    ...prismaBallot,
    votes: prismaBallot.votes as Vote[],
  };
}

export const votesSchema = z.array(
  z.object({
    projectId: z.string(),
    amount: z.string(),
  })
);

export const ballotSchema = z
  .object({
    address: z.string(),
    votes: votesSchema,
  })
  .strict();

export type BallotsStore = {
  getSortedProjectsFromBallots(): Promise<string[]>;
};

export function makeBallotsStore(): BallotsStore {
  return {
    async getSortedProjectsFromBallots() {
      const ballots = await PrismaSingleton.instance.ballot.findMany({
        where: {
          votes: {
            not: {
              isEmpty: true,
            },
          },
        },
      });

      const projects = new Map<string, number>();

      ballots.forEach((ballot) => {
        toBallotType(ballot).votes.forEach((vote) => {
          const existingVote = projects.get(vote.projectId);
          if (existingVote) {
            projects.set(vote.projectId, existingVote + 1);
          } else {
            projects.set(vote.projectId, 1);
          }
        });
      });

      const sortedProjects = Array.from(projects.entries()).sort(
        compareBy((it) => it[1])
      );

      return sortedProjects.map((project) => project[0]);
    },
  };
}
