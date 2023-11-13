import { css } from "@emotion/css";
import * as theme from "../../../theme";
import { HStack, VStack } from "../../../components/VStack";
import { icons } from "../../../icons/icons";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { RetroPGFApplicationContentFundingSource } from "./RetroPGFApplicationContentFundingSource";
import { RetroPGFApplicationListContainer } from "./RetroPGFApplicationListContainer";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFApplicationContentFragment$key } from "./__generated__/RetroPGFApplicationContentFragment.graphql";
import { RetroPGFApplicationContentContributionLinkFragment$key } from "./__generated__/RetroPGFApplicationContentContributionLinkFragment.graphql";
import { RetroPGFApplicationContentImpactMetricFragment$key } from "./__generated__/RetroPGFApplicationContentImpactMetricFragment.graphql";

export function RetroPGFApplicationContent({
  fragmentRef,
}: {
  fragmentRef: RetroPGFApplicationContentFragment$key;
}) {
  const project = useFragment(
    graphql`
      fragment RetroPGFApplicationContentFragment on Project {
        impactDescription
        contributionDescription
        contributionLinks {
          ...RetroPGFApplicationContentContributionLinkFragment
        }
        impactMetrics {
          ...RetroPGFApplicationContentImpactMetricFragment
        }
        ...RetroPGFApplicationContentFundingSourceFragment
        ...RetroPGFApplicationListContainerFragment
      }
    `,
    fragmentRef
  );

  return (
    <VStack>
      <HStack
        gap="16"
        justifyContent="space-between"
        alignItems="flex-start"
        className={css`
          padding-left: ${theme.spacing["4"]};
          padding-right: ${theme.spacing["4"]};
          padding-top: ${theme.spacing["4"]};
          padding-bottom: ${theme.spacing["4"]};
          max-width: ${theme.maxWidth["6xl"]};
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-end;
            padding-bottm: 0;
            gap: 0;
          }
        `}
      >
        <VStack>
          <h2
            className={css`
              font-family: "Inter";
              font-style: normal;
              font-weight: 900;
              font-size: 24px;
              line-height: 29px;
              color: #000000;
              margin-bottom: 14px;
            `}
          >
            Contribution
          </h2>
          <div
            className={css`
              font-family: "Inter";
              font-style: normal;
              font-weight: 500;
              font-size: 16px;
              line-height: 24px;
              color: #4f4f4f;
              padding-bottom: 14px;
              white-space: pre-wrap;
              overflow-wrap: break-word;
              @media (max-width: ${theme.maxWidth["2xl"]}) {
                padding-bottm: 0;
                max-width: calc(100vw - 48px);
              }
            `}
          >
            {project.contributionDescription}
          </div>
        </VStack>

        <VStack
          justifyContent="space-between"
          className={css`
            flex-shrink: 0;
            width: ${theme.maxWidth.sm};
            border: 1px solid ${theme.colors.gray.eb};
            border-radius: ${theme.borderRadius["xl"]};
            box-shadow: ${theme.boxShadow.newDefault};
            margin-top: ${theme.spacing["8"]};
            margin-bottom: ${theme.spacing["8"]};
            padding-left: ${theme.spacing["4"]};
            padding-right: ${theme.spacing["4"]};
            padding-top: ${theme.spacing["4"]};
            padding-bottom: ${theme.spacing["4"]};
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              align-items: stretch;
              margin-top: 0px;
              justify-content: flex-end;
              width: 100%;
              height: auto;
            }
          `}
        >
          <div>
            <h3
              className={css`
                font-family: "Inter";
                font-style: normal;
                font-weight: 600;
                font-size: 12px;
                line-height: 16px;
                color: #4f4f4f;
              `}
            >
              Contribution links
            </h3>
            <ul
              className={css`
                list-style: none;
                margin: 0;
                padding: 0;
              `}
            >
              {project.contributionLinks.map((contributionLink, idx) => (
                <ContributionLink key={idx} fragmentRef={contributionLink} />
              ))}
            </ul>
          </div>
        </VStack>
      </HStack>
      <HStack
        gap="16"
        justifyContent="space-between"
        alignItems="flex-start"
        className={css`
          padding-left: ${theme.spacing["4"]};
          padding-right: ${theme.spacing["4"]};
          padding-top: ${theme.spacing["4"]};
          padding-bottom: ${theme.spacing["8"]};
          max-width: ${theme.maxWidth["6xl"]};
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            flex-direction: column;
            gap: 0;
            align-items: stretch;
            justify-content: flex-end;
          }
        `}
      >
        <VStack>
          <h2
            className={css`
              font-family: "Inter";
              font-style: normal;
              font-weight: 900;
              font-size: 24px;
              line-height: 29px;
              color: #000000;
              margin-bottom: 14px;
            `}
          >
            Impact
          </h2>
          <div
            className={css`
              font-family: "Inter";
              font-style: normal;
              font-weight: 500;
              font-size: 16px;
              line-height: 24px;
              color: #4f4f4f;
              padding-bottom: 14px;
              white-space: pre-wrap;

              @media (max-width: ${theme.maxWidth["2xl"]}) {
                padding-bottm: 0px;
                max-width: calc(100vw - 48px);
              }
            `}
          >
            {project.impactDescription}
          </div>
        </VStack>

        <VStack
          justifyContent="space-between"
          className={css`
            flex-shrink: 0;
            width: ${theme.maxWidth.sm};
            border: 1px solid ${theme.colors.gray.eb};
            border-radius: ${theme.borderRadius["xl"]};
            box-shadow: ${theme.boxShadow.newDefault};
            margin-top: ${theme.spacing["8"]};
            margin-bottom: ${theme.spacing["8"]};
            padding-left: ${theme.spacing["4"]};
            padding-right: ${theme.spacing["4"]};
            padding-top: ${theme.spacing["4"]};
            padding-bottom: ${theme.spacing["4"]};
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              align-items: stretch;
              margin-top: 0px;
              justify-content: flex-end;
              width: 100%;
              height: auto;
            }
          `}
        >
          <div>
            <h3
              className={css`
                font-family: "Inter";
                font-style: normal;
                font-weight: 600;
                font-size: 12px;
                line-height: 16px;
                color: #4f4f4f;
              `}
            >
              Impact Metrics
            </h3>
            <VStack
              className={css`
                list-style: none;
                margin: 0;
                padding: 0;
              `}
            >
              {project.impactMetrics.map((impactMetric, idx) => (
                <ImpactMetric key={idx} fragmentRef={impactMetric} />
              ))}
            </VStack>
          </div>
        </VStack>
      </HStack>
      <RetroPGFApplicationContentFundingSource fragmentRef={project} />
      <RetroPGFApplicationListContainer fragmentRef={project} />
    </VStack>
  );
}

const ContributionLink = ({
  fragmentRef,
}: {
  fragmentRef: RetroPGFApplicationContentContributionLinkFragment$key;
}) => {
  const contributionLink = useFragment(
    graphql`
      fragment RetroPGFApplicationContentContributionLinkFragment on ContributionLink {
        type
        url
        description
      }
    `,
    fragmentRef
  );

  const icon = (() => {
    switch (contributionLink.type) {
      case "CONTRACT_ADDRESS":
        return "scroll";
      case "GITHUB_REPO":
        return "github";
      case "OTHER":
        return "world";

      default:
        return "world";
    }
  })();

  return (
    <a href={contributionLink.url} rel="noreferrer nonopener" target="_blank">
      <HStack
        alignItems="flex-start"
        className={css`
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 16px;
        `}
      >
        <HStack gap="3">
          <div
            className={css`
              margin-top: ${theme.spacing[1]};
            `}
          >
            <img src={icons[icon]} alt={icon} />
          </div>
          <p
            className={css`
              max-width: 300px;
              color: #000000;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {contributionLink.description}
          </p>
        </HStack>

        <ArrowTopRightOnSquareIcon
          className={css`
            margin-top: ${theme.spacing[1]};
            width: 20px;
            height: 20px;
            color: ${theme.colors.gray["500"]};
          `}
        />
      </HStack>
    </a>
  );
};

const ImpactMetric = ({
  fragmentRef,
}: {
  fragmentRef: RetroPGFApplicationContentImpactMetricFragment$key;
}) => {
  const impactMetric = useFragment(
    graphql`
      fragment RetroPGFApplicationContentImpactMetricFragment on ImpactMetric {
        description
        number
        url
      }
    `,
    fragmentRef
  );

  return (
    <li
      className={css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding-top: 16px;
      `}
    >
      <a href={impactMetric.url} rel="noreferrer nonopener" target="_blank">
        <div
          className={css`
            max-width: 300px;
            color: #000000;
          `}
        >
          {impactMetric.description}
        </div>
      </a>
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 8px;
        `}
      >
        <div
          className={css`
            color: #000000;
          `}
        >
          {formatNumber(Number(impactMetric.number))}
        </div>
        <a
          href={impactMetric.url}
          rel="noreferrer nonopener"
          target="_blank"
          className={css`
            display: flex;
            align-items: center;
            gap: 8px;
          `}
        >
          <ArrowTopRightOnSquareIcon
            className={css`
              width: 20px;
              height: 20px;
              color: ${theme.colors.gray["500"]};
            `}
          />
        </a>
      </div>
    </li>
  );
};

function formatNumber(number: number) {
  const numberFormat = new Intl.NumberFormat("en", {
    style: "decimal",
    maximumSignificantDigits: 2,
    currencyDisplay: "code",
    compactDisplay: "short",
    notation: "compact",
  });

  const parts = numberFormat.formatToParts(number);
  return parts
    .filter((part) => part.type !== "currency" && part.type !== "literal")
    .map((part) => part.value)
    .join("");
}
