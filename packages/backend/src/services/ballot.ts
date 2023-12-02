import { ethers } from "ethers";
import { z } from "zod";
import { DefaultArgs } from "@envelop/core";
import { Prisma } from "@prisma/client";
import PrismaSingleton from "../store/prisma/client";
import { validateSafeSignature, validateSigned } from "../utils/signing";
import { compareBy } from "../indexer/utils/sortUtils";
import { isTrezor } from "./auth";

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
      // messaged is hashed for trezor wallets
      const isTrezorWallet = await isTrezor(address);

      // Verify signature
      try {
        const code = await provider.getCode(address);

        if (code === "0x") {
          await validateSigned(provider, {
            value: isTrezorWallet
              ? ethers.utils.keccak256(
                  new TextEncoder().encode(JSON.stringify(votes))
                )
              : JSON.stringify(votes),
            signature,
            signerAddress: address,
            signatureType: "EOA" as any,
          });
        } else {
          await validateSafeSignature(provider, {
            message: JSON.stringify(votes),
            signature,
            signerAddress: address,
          });
        }
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
            signedPayload: JSON.stringify(votes),
            updatedAt: new Date(),
            publishedAt: new Date(),
          },
          create: {
            address,
            votes,
            signature,
            signedPayload: JSON.stringify(votes),
            signedPayloadHash: isTrezorWallet
              ? ethers.utils.keccak256(
                  new TextEncoder().encode(JSON.stringify(votes))
                )
              : null,
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
  getBallotsCountForProject(projectId: string): Promise<number>;
};

export function makeBallotsStore(): BallotsStore {
  return {
    async getSortedProjectsFromBallots() {
      const sortedProjects =
        await PrismaSingleton.instance.projectsInBallots.findMany({
          orderBy: {
            count: "asc",
          },
        });

      return sortedProjects.map((project) => project.projectId);
    },

    async getBallotsCountForProject(projectId: string) {
      const count = await PrismaSingleton.instance.projectsInBallots.findFirst({
        where: { projectId },
      });

      return Number(count?.count || 0);
    },
  };
}
