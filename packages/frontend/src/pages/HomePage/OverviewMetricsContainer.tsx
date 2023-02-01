import { css } from "@emotion/css";
import { ReactNode } from "react";
import * as theme from "../../theme";
import { icons } from "../../icons/icons";
import { HStack, VStack } from "../../components/VStack";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { OverviewMetricsContainerFragment$key } from "./__generated__/OverviewMetricsContainerFragment.graphql";
import { TokenAmountDisplay } from "../../components/TokenAmountDisplay";
import { BigNumber } from "ethers";
import { CalendarIcon } from "@heroicons/react/20/solid";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";

type Props = {
  fragmentRef: OverviewMetricsContainerFragment$key;
};

export function OverviewMetricsContainer({ fragmentRef }: Props) {
  const { metrics } = useFragment(
    graphql`
      fragment OverviewMetricsContainerFragment on Query {
        metrics {
          delegatedSupply {
            amount
            ...TokenAmountDisplayFragment
          }

          totalSupply {
            amount
            ...TokenAmountDisplayFragment
          }

          quorum {
            amount {
              ...TokenAmountDisplayFragment
            }

            bpsOfTotal
          }

          proposalThreshold {
            amount {
              ...TokenAmountDisplayFragment
            }

            bpsOfTotal
          }
        }
      }
    `,
    fragmentRef
  );
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
        title="Delegated token / Total supply"
        body={
          <>
            <TokenAmountDisplay fragment={metrics.delegatedSupply} /> /{" "}
            <TokenAmountDisplay fragment={metrics.totalSupply} />
          </>
        }
      />
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
            src={icons.ballot}
            alt={icons.ballot}
          />
        </div>
        <VStack>
          <div
            className={css`
              font-size: ${theme.fontSize.sm};
              color: ${theme.colors.gray["700"]};
            `}
          >
            Quorum
          </div>
          <HStack gap="2" alignItems="center">
            <div>30% of delegated tokens </div>
          </HStack>
        </VStack>
      </HStack>
      <a
        href="https://github.com/ethereum-optimism/OPerating-manual/blob/main/manual.md"
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
            <img
              className={css`
                width: 24px;
                height: 24px;
              `}
              src={icons.ballot}
              alt={icons.ballot}
            />
          </div>
          <VStack>
            <div
              className={css`
                font-size: ${theme.fontSize.sm};
                color: ${theme.colors.gray["700"]};
              `}
            >
              Learn more
            </div>
            <HStack gap="2" alignItems="center">
              <div>Governance handbook</div>
              <ArrowTopRightOnSquareIcon
                className={css`
                  width: 16px;
                  height: 16px;
                  color: ${theme.colors.gray["500"]};
                `}
              ></ArrowTopRightOnSquareIcon>
            </HStack>
          </VStack>
        </HStack>
      </a>

      <a
        href="https://calendar.google.com/calendar/u/0/r?cid=Y19mbm10Z3VoNm5vbzZxZ2JuaTJncGVyaWQ0a0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t"
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
            <CalendarIcon
              className={css`
                color: ${theme.colors.gray["700"]};
                width: 24px;
                height: 24px;
              `}
            ></CalendarIcon>
          </div>
          <VStack>
            <div
              className={css`
                font-size: ${theme.fontSize.sm};
                color: ${theme.colors.gray["700"]};
              `}
            >
              Learn more
            </div>
            <HStack gap="2" alignItems="center">
              <div>Proposals calendar</div>
              <ArrowTopRightOnSquareIcon
                className={css`
                  width: 16px;
                  height: 16px;
                  color: ${theme.colors.gray["500"]};
                `}
              ></ArrowTopRightOnSquareIcon>
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
