import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import {
  DelegatesOrder,
  HomePageQuery,
} from "./__generated__/HomePageQuery.graphql";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { OverviewMetricsContainer } from "./OverviewMetricsContainer";
import { DelegatesContainer } from "./DelegatesContainer";
import { VStack, HStack } from "../../components/VStack";
import NounsPics from "./NounsPics.png";
import {
  useLocation,
  Location,
} from "../../components/HammockRouter/HammockRouter";
import { PageDivider } from "../../components/PageDivider";

const orderByValidValues: HomePageQuery["variables"]["orderBy"][] = [
  "mostVotingPower",
  // "mostRelevant",
  // "mostNounsRepresented",
  "leastVotesCast",
  // "mostRecentlyActive",
  "mostVotesCast",
];

export type LocationVariables = {
  orderBy: DelegatesOrder;
};

export function locationToVariables(location: Location): LocationVariables {
  return {
    orderBy:
      orderByValidValues.find(
        (needle) => needle === location.search["orderBy"]
      ) ?? "mostVotingPower",
  };
}

export function HomePage() {
  const location = useLocation();
  const variables = locationToVariables(location);

  const result = useLazyLoadQuery<HomePageQuery>(
    graphql`
      query HomePageQuery($orderBy: DelegatesOrder!) {
        ...DelegatesContainerFragment @arguments(orderBy: $orderBy)
        ...OverviewMetricsContainerFragment
      }
    `,
    {
      ...variables,
    }
  );

  return (
    <>
      {/* <Hero /> */}
      <Banner />
      <OverviewMetricsContainer fragmentRef={result} />
      <PageDivider />
      <DelegatesContainer fragmentKey={result} variables={variables} />
    </>
  );
}
function Banner() {
  return (
    <a
      href="https://prop.house/noun-40/noun-40-looking-for-prop-house-delegate"
      target="_blank"
      rel="noreferrer"
      className={css`
        @media (max-width: ${theme.maxWidth.lg}) {
          width: auto;
        }
        width: ${theme.maxWidth["6xl"]};
      `}
    >
      <HStack
        justifyContent="space-between"
        className={css`
          background-color: ${theme.colors.white};
          border-radius: ${theme.borderRadius["xl"]};
          box-shadow: ${theme.boxShadow["newDefault"]};
          margin: 0 ${theme.spacing["4"]};
          border: 1px solid ${theme.colors.gray["300"]};
          margin-bottom: ${theme.spacing["8"]};
          padding: ${theme.spacing["8"]};
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          :hover {
            transform: scale(1.005);
            transform: translateY(-1px);
            box-shadow: ${theme.boxShadow["md"]};
          }
          @media (max-width: ${theme.maxWidth.lg}) {
            flex-direction: column;
          }
        `}
      >
        <VStack
          justifyContent="center"
          className={css`
            max-width: ${theme.maxWidth["lg"]};
          `}
        >
          <div
            className={css`
              font-size: ${theme.fontSize.sm};
              color: ${theme.colors.teal["600"]};
              font-weight: ${theme.fontWeight["medium"]};
            `}
          >
            Submit your profile to
          </div>
          <div
            className={css`
              font-size: ${theme.fontSize["2xl"]};
              font-weight: ${theme.fontWeight["extrabold"]};
            `}
          >
            Be the delegate for 22 nouns on Prop House
          </div>
          <div
            className={css`
              color: ${theme.colors.gray["700"]};
            `}
          >
            Noun 40 is looking for a Prop-House-only delegate for 22 nouns
            currently represented by vote.noun40.eth. Will you be the one?
          </div>
        </VStack>
        <img
          src={NounsPics}
          alt="Noun 40's nouns"
          className={css`
            max-height: ${theme.spacing["32"]};
            @media (max-width: ${theme.maxWidth.lg}) {
              margin-top: ${theme.spacing["4"]};
            }
          `}
        />
      </HStack>
    </a>
  );
}

function Hero() {
  return (
    <VStack
      className={css`
        max-width: ${theme.maxWidth["xl"]};
        text-align: center;
        padding: 0 ${theme.spacing["4"]};
        margin: ${theme.spacing["16"]} 0;
        @media (max-width: ${theme.maxWidth.lg}) {
          margin: 0;
          text-align: left;
          width: 100%;
        }
      `}
    >
      <h1
        className={css`
          font-weight: ${theme.fontWeight.extrabold};
          font-size: ${theme.fontSize["2xl"]};
          @media (min-width: ${theme.maxWidth.lg}) {
            display: none;
          }
        `}
      >
        Voter metrics
      </h1>
      <h1
        className={css`
          font-weight: ${theme.fontWeight.extrabold};
          font-size: ${theme.fontSize["2xl"]};
          @media (max-width: ${theme.maxWidth.lg}) {
            display: none;
          }
        `}
      >
        Agora is the home of nouns voters
      </h1>

      <p
        className={css`
          color: ${theme.colors.gray["700"]};
          font-size: ${theme.fontSize.base};
          @media (max-width: ${theme.maxWidth.lg}) {
            display: none;
          }
        `}
      >
        Nouns voters are the stewards for the DAO. You can see them all below,
        delegate your votes to them, or contact them about your ideas.
      </p>
    </VStack>
  );
}
