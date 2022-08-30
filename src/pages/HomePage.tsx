import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { HomePageQuery } from "./__generated__/HomePageQuery.graphql";
import { css } from "@emotion/css";
import * as theme from "../theme";
import logo from "../logo.svg";
import { icons } from "../icons/icons";
import { ReactNode } from "react";
import { useFragment } from "react-relay";
import { HomePageVoterCardFragment$key } from "./__generated__/HomePageVoterCardFragment.graphql";
import { DelegateNounGrid } from "../components/DelegateNounGrid";
import { NounResolvedName } from "../components/NounResolvedName";
import { Link } from "react-router-dom";

// TODO: this is the max page size
const pageSize = 1000;

export function HomePage() {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: ${theme.fontFamily.sans};
        width: 100%;
      `}
    >
      <PageHeader />
      <Hero />

      <OverviewMetricsContainer />
      <PageDivider />
      <DelegatesContainer />
    </div>
  );
}

function PageHeader() {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: row;
        width: ${theme.maxWidth["6xl"]};
        margin: ${theme.spacing["8"]} auto;
        padding: 0 ${theme.spacing["4"]};
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: row;
          gap: ${theme.spacing["4"]};
        `}
      >
        <img src={logo} />

        <span
          className={css`
            font-size: ${theme.fontSize.sm};
            color: ${theme.colors.gray["700"]};
          `}
        >
          Nouns Agora
        </span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        max-width: ${theme.maxWidth["xl"]};
        text-align: center;

        margin: ${theme.spacing["16"]} 0;
      `}
    >
      <h1
        className={css`
          font-weight: bolder;
          font-size: ${theme.fontSize["3xl"]};
        `}
      >
        Agora is the home of nouns voters
      </h1>

      <p
        className={css`
          color: ${theme.colors.gray["700"]};
          font-size: ${theme.fontSize.sm};
        `}
      >
        Nouns voters are the stewards for the DAO. You can see them all below,
        delegate your votes to them, or contact them about your ideas.
      </p>
    </div>
  );
}

function PageDivider() {
  return (
    <div
      className={css`
        background: ${theme.colors.gray["300"]};
        width: 100%;
        height: 1px;
        margin-top: -${theme.spacing["8"]};
        z-index: -1;
      `}
    />
  );
}

function OverviewMetricsContainer() {
  return (
    <div
      className={css`
        display: flex;
        max-width: ${theme.maxWidth["6xl"]};
        gap: ${theme.spacing["4"]};
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
      `}
    >
      {/* todo: real values */}
      <MetricContainer
        icon="community"
        title="Voters / Nouns"
        body="203 / 338 (45% delegation)"
      />

      <MetricContainer
        icon="ballot"
        title="Quorum"
        body="39 nouns (10% of supply)"
      />

      <MetricContainer
        icon="measure"
        title="Proposal threshold"
        body="1 noun -> 2 on Sep 21"
      />

      <MetricContainer icon="pedestrian" title="Avg voter turnout" body="54%" />
    </div>
  );
}

type MetricContainerProps = {
  icon: keyof typeof icons;
  title: string;
  body: ReactNode;
};

const color = "#FBFBFB";

function MetricContainer({ icon, title, body }: MetricContainerProps) {
  return (
    <div
      className={css`
        display: flex;
        background: ${theme.colors.white};
        flex-direction: row;
        border-radius: ${theme.spacing["3"]};
        padding: ${theme.spacing["3"]};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
        box-shadow: ${theme.boxShadow.sm};
        gap: ${theme.spacing["3"]};
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: ${theme.spacing["3"]};
          border-width: ${theme.spacing.px};
          border-color: ${theme.colors.gray["300"]};
          background: ${color};
          flex-shrink: 0;
          padding: ${theme.spacing["3"]};
        `}
      >
        <img
          className={css`
            width: 24px;
            height: 24px;
          `}
          src={icons[icon]}
          alt={icon}
        />
      </div>

      <div
        className={css`
          display: flex;
          flex-direction: column;
          padding-right: ${theme.spacing["1"]};
        `}
      >
        <div
          className={css`
            font-size: ${theme.fontSize.sm};
            color: ${theme.colors.gray["700"]};
            white-space: nowrap;
            text-overflow: ellipsis;
          `}
        >
          {title}
        </div>

        <div
          className={css`
            white-space: nowrap;
            text-overflow: ellipsis;
          `}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

function DelegatesContainer() {
  const pageNumber = 0;

  const { delegates } = useLazyLoadQuery<HomePageQuery>(
    graphql`
      query HomePageQuery($pageSize: Int!, $skip: Int) {
        delegates(
          first: $pageSize
          skip: $skip
          where: { tokenHoldersRepresentedAmount_gt: 0, delegatedVotes_gt: 0 }
          orderBy: delegatedVotes
          orderDirection: desc
        ) {
          id
          delegatedVotes
          tokenHoldersRepresentedAmount

          ...HomePageVoterCardFragment
        }
      }
    `,
    {
      pageSize,
      skip: pageSize * pageNumber,
    }
  );

  // todo: move
  if (!delegates) {
    return null;
  }

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;

        z-index: -1;
        background-image: radial-gradient(
          rgba(0, 0, 0, 10%) 1px,
          transparent 0
        );
        background-size: 20px 20px;
        height: 300px;
        width: 100%;
        padding-top: ${theme.spacing["16"]};
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          max-width: ${theme.maxWidth["6xl"]};
          width: 100%;
          margin-bottom: ${theme.spacing["8"]};
        `}
      >
        <h2
          className={css`
            font-size: ${theme.fontSize["2xl"]};
            font-weight: bolder;
          `}
        >
          Voters
        </h2>
      </div>

      <div
        className={css`
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: ${theme.spacing["8"]};
        `}
      >
        {delegates.map((delegate) => (
          <VoterCard fragmentRef={delegate} />
        ))}
      </div>
    </div>
  );
}

type VoterCardProps = {
  fragmentRef: HomePageVoterCardFragment$key;
};

function VoterCard({ fragmentRef }: VoterCardProps) {
  const delegate = useFragment(
    graphql`
      fragment HomePageVoterCardFragment on Delegate {
        id

        votes {
          id
        }

        ...DelegateNounGridFragment
      }
    `,
    fragmentRef
  );

  return (
    <Link to={`/delegate/${delegate.id}`}>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          padding: ${theme.spacing["4"]};

          border-radius: ${theme.borderRadius.lg};
          background: ${theme.colors.white};
          border-width: ${theme.spacing.px};
          border: ${theme.colors.gray["300"]};
          border-style: solid;
          box-shadow: ${theme.boxShadow.lg};
          cursor: pointer;

          :hover {
            box-shadow: ${theme.boxShadow.xl};
          }
        `}
      >
        <DelegateNounGrid fragmentKey={delegate} />
        <div
          className={css`
            display: flex;
            flex-direction: row;
            justify-content: space-between;

            margin-top: ${theme.spacing["4"]};
          `}
        >
          <div>
            <NounResolvedName address={delegate.id} />
          </div>

          <div>Voted {delegate.votes.length} times</div>
        </div>
      </div>
    </Link>
  );
}
