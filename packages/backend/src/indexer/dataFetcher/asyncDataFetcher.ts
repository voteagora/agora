import { z } from "zod";

export type AsyncDataFetcher = {
  getApplicationData: (
    url: string
  ) => Promise<typeof applicationData["_output"]>;
  getListData: (url: string) => Promise<typeof listData["_output"]>;
};

export function asyncDataFetcher(): AsyncDataFetcher {
  return {
    getApplicationData: async (url: string) => {
      const res = await fetch(url);
      const data = await res.json();

      return applicationData.parse(data);
    },
    getListData: async (url: string) => {
      const res = await fetch(url);
      const data = await res.json();

      return listData.parse(data);
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
  listName: z.string(),
  listDescription: z.string(),
  impactEvaluationDescription: z.string(),
  impactEvaluationLink: z.string(),
  listContent: z.array(
    z.object({
      RPGF3_Application_UID: z.string(),
      OPAmount: z.number(),
    })
  ),
});
