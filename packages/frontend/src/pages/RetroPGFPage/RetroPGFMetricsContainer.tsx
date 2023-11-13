import { css } from "@emotion/css";
import { ReactNode } from "react";
import * as theme from "../../theme";
import { icons } from "../../icons/icons";
import { HStack, VStack } from "../../components/VStack";
import { BookOpenIcon } from "@heroicons/react/20/solid";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { RetroPGFMetricsContainer$key } from "./__generated__/RetroPGFMetricsContainer.graphql";
import { useSIWE } from "connectkit";

export function RetroPGFMetricsContainer({
  fragmentRef,
}: {
  fragmentRef: RetroPGFMetricsContainer$key;
}) {
  const { total } = useFragment(
    graphql`
      fragment RetroPGFMetricsContainer on ProjectsAggregate {
        total
      }
    `,
    fragmentRef
  );

  const { isSignedIn } = useSIWE();

  return (
    <HStack
      justifyContent="space-between"
      gap="4"
      className={css`
        max-width: ${theme.maxWidth["6xl"]};
        width: 100%;
        flex-wrap: wrap;
        z-index: 1;

        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};

        @media (max-width: ${theme.maxWidth["6xl"]}) {
          justify-content: center;
        }

        @media (max-width: ${theme.maxWidth.lg}) {
          flex-direction: column;
          align-items: stretch;
        }
      `}
    >
      <MetricContainer
        icon="community"
        title="Eligible for RetroPGF 3"
        body={`${total} projects`}
      />

      <MetricContainer
        icon="ballot"
        title="Voting period"
        body="Nov 6 - Dec 7, 2023"
      />

      <MetricContainer icon="measure" title="Total rewards" body="30M OP" />

      <a
        href={
          isSignedIn
            ? "https://www.optimism.io/badgeholder-manual"
            : "https://community.optimism.io/docs/governance/retropgf-3/"
        }
        target="_blank"
        rel="noreferrer"
      >
        <HStack
          gap="3"
          className={css`
            background: ${theme.colors.white};
            border-radius: ${theme.spacing["3"]};
            padding: ${theme.spacing["3"]};
            border-width: ${theme.spacing.px};
            border-color: ${theme.colors.gray["300"]};
            box-shadow: ${theme.boxShadow.newDefault};
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: ${theme.spacing["2"]};
              border-width: ${theme.spacing.px};
              border-color: ${theme.colors.gray["300"]};
              background: ${color};
              flex-shrink: 0;
              padding: ${theme.spacing["3"]};
            `}
          >
            <BookOpenIcon
              className={css`
                color: ${theme.colors.gray["700"]};
                width: 24px;
                height: 24px;
              `}
            ></BookOpenIcon>
          </div>
          <VStack>
            <HStack
              gap="1"
              alignItems="center"
              className={css`
                font-size: ${theme.fontSize.sm};
                color: ${theme.colors.gray["700"]};
              `}
            >
              Learn more{" "}
              <ArrowTopRightOnSquareIcon
                className={css`
                  width: 12px;
                  height: 12px;
                  color: ${theme.colors.gray["500"]};
                  diplsy: inline;
                `}
              />
            </HStack>
            <HStack gap="2" alignItems="center">
              <div>{isSignedIn ? "Badgeholder Manual" : "About RetroPGF"}</div>
            </HStack>
          </VStack>
        </HStack>
      </a>
    </HStack>
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
    <HStack
      gap="3"
      className={css`
        background: ${theme.colors.white};
        border-radius: ${theme.spacing["3"]};
        padding: ${theme.spacing["3"]};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray["300"]};
        box-shadow: ${theme.boxShadow.newDefault};
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: ${theme.spacing["2"]};
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

      <VStack
        className={css`
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
      </VStack>
    </HStack>
  );
}
