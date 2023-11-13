import { icons } from "../../icons/icons";

export interface RetroPGFApplication {
  name: string;
  description: string;
  appIcon: string;
}

export interface RetroPGFList {
  name: string;
  creator: string;
  creatorLogo: string;
  description: string;
  impact: string;
  impact_url: string;
  applications: RetroPGFApplication[];
  likes: number;
}

export interface RetroPGFApplicationListContainerProps {
  retroPGFLists: RetroPGFList[];
}

export interface RetroPGFListRowProps {
  list: RetroPGFList;
}

export type BallotStatusCardProps = {
  remainingTime: string;
  allocatedProjects: string;
  allocatedOPTokens: number;
};

export type retroPGFUser = {
  name: string;
  logo: string;
  address: string;
};

export type RetroPGFBallotPageHeaderProps = {
  user: retroPGFUser;
};

export type RetroPGFListPageHeaderProps = {
  list: RetroPGFList;
};

export type RetroPGFApplicationRowProps = {
  application: RetroPGFApplication;
  isBallot: boolean;
};

export type RetroPGFIconListItemProps = {
  text: string;
  href: string;
  icon: keyof typeof icons;
};
