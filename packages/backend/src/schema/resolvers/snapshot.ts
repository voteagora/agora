import {
  SnapshotProposalResolvers,
  SnapshotVoteChoiceApprovalResolvers,
  SnapshotVoteChoiceQuadraticResolvers,
  SnapshotVoteChoiceRankedResolvers,
  SnapshotVoteChoiceResolvers,
  SnapshotVoteChoiceSingleResolvers,
  SnapshotVoteChoiceWeightedResolvers,
  SnapshotVoteResolvers,
} from "./generated/types";

export type SnapshotVoteModel = {
  id: string;
  created: number;
  reason: string;
  proposal: SnapshotProposalModel;
  choice: any;
  vp: number;
};

export const SnapshotVote: SnapshotVoteResolvers = {
  id({ id }) {
    return id;
  },
  createdAt({ created }) {
    return new Date(created * 1000);
  },
  proposal({ proposal }, _args) {
    return proposal;
  },
  reason({ reason }) {
    return reason;
  },
  votingPower({ vp }) {
    return vp;
  },
  choice(vote) {
    return vote;
  },
};

export type SnapshotProposalModel = {
  id: string;
  title: string;
  link: string;
  choices: string[];
  scores: number[];
  type: string;
};

export const SnapshotProposal: SnapshotProposalResolvers = {
  id({ id }) {
    return id;
  },
  title({ title }) {
    return title;
  },
  link({ link }) {
    return link;
  },
  choices({ choices, scores }: { choices: string[]; scores: number[] }) {
    return choices.map((choice, idx) => ({
      title: choice,
      score: scores[idx],
    }));
  },
};

export type SnapshotVoteChoiceModel = SnapshotVoteModel;

export const SnapshotVoteChoice: SnapshotVoteChoiceResolvers = {
  __resolveType({ proposal }) {
    switch (proposal.type) {
      case "basic":
      case "single-choice":
        return "SnapshotVoteChoiceSingle";

      case "ranked-choice":
        return "SnapshotVoteChoiceRanked";
      case "quadratic":
        return "SnapshotVoteChoiceQuadratic";

      case "approval":
        return "SnapshotVoteChoiceApproval";
      case "weighted":
        return "SnapshotVoteChoiceWeighted";

      default:
        throw new Error(`unknown proposal type ${proposal.type}`);
    }
  },
};

export const SnapshotVoteChoiceApproval: SnapshotVoteChoiceApprovalResolvers = {
  approvedChoices({ choice }) {
    return choice;
  },
};

export const SnapshotVoteChoiceSingle: SnapshotVoteChoiceSingleResolvers = {
  selectedChoiceIdx({ choice }) {
    return choice;
  },
};

export const SnapshotVoteChoiceRanked: SnapshotVoteChoiceRankedResolvers = {
  choices({ choice }) {
    return choice;
  },
};

export const SnapshotVoteChoiceQuadratic: SnapshotVoteChoiceQuadraticResolvers =
  {
    weights({ choice }) {
      return Object.entries(choice as { [choiceIdx: string]: number }).map(
        ([choiceIdx, weight]) => ({
          choiceIdx: Number(choiceIdx),
          weight,
        })
      );
    },
  };

export const SnapshotVoteChoiceWeighted: SnapshotVoteChoiceWeightedResolvers = {
  weights({ choice }) {
    return Object.entries(choice as { [choiceIdx: string]: number }).map(
      ([choiceIdx, weight]) => ({
        choiceIdx: Number(choiceIdx),
        weight,
      })
    );
  },
};

export type WeightedSelectedChoiceModel = {
  choiceIdx: number;
  weight: number;
};
