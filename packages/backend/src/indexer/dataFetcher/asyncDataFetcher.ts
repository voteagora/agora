import { z } from "zod";

export type AsyncDataFetcher = {
  getApplicationData: (
    url: string
  ) => Promise<typeof applicationData["_output"] | null>;
  getListData: (url: string) => Promise<typeof listData["_output"] | null>;
  getProfileData: (
    url: string
  ) => Promise<typeof profileData["_output"] | null>;
};

export function asyncDataFetcher(): AsyncDataFetcher {
  return {
    getApplicationData: async (url: string) => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        return applicationData.parse(data);
      } catch (e) {
        return null;
      }
    },
    getListData: async (url: string) => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        return listData.parse(data);
      } catch (e) {
        return null;
      }
    },
    getProfileData: async (url: string) => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        return profileData.parse(data);
      } catch (e) {
        return null;
      }
    },
  };
}

const applicationData = z.object({
  applicantType: z.string(),
  websiteUrl: z.string(),
  bio: z.string(),
  contributionDescription: z.string(),
  contributionLinks: z.array(
    z.object({
      type: z.string(),
      url: z.string(),
      description: z.string(),
    })
  ),
  impactCategory: z.array(z.string()),
  impactDescription: z.string(),
  impactMetrics: z.array(
    z.object({
      description: z.string(),
      number: z.number(),
      url: z.string(),
    })
  ),
  fundingSources: z.array(
    z.object({
      type: z.string(),
      currency: z.string(),
      amount: z.number(),
      description: z.string(),
    })
  ),
  payoutAddress: z.string(),
  understoodKYCRequirements: z.boolean(),
  understoodFundClaimPeriod: z.boolean(),
  certifiedNotDesignatedOrSanctionedOrBlocked: z.boolean(),
  certifiedNotSponsoredByPoliticalFigureOrGovernmentEntity: z.boolean(),
  certifiedNotBarredFromParticipating: z.boolean(),
});

const listData = z.object({
  listDescription: z.string(),
  impactEvaluationDescription: z.string(),
  impactEvaluationLink: z.string(),
  listContent: z.array(
    z.object({
      RPGF3_Application_UID: z.string(),
      OPAmount: z.number(),
    })
  ),
  impactCategory: z.optional(z.array(z.string())),
});

const profileData = z.object({
  profileImageUrl: z.optional(z.string()),
  bannerImageUrl: z.optional(z.string()),
  websiteUrl: z.optional(z.string()),
  bio: z.optional(z.string()),
});
