import { css } from "@emotion/css";
import { ReactNode } from "react";
import * as theme from "../../theme";
import { icons } from "../../icons/icons";

export function OverviewMetricsContainer() {
  // todo: real values
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
