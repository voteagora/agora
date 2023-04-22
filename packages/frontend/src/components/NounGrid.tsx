import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { NounImage } from "./NounImage";
import { css, cx } from "@emotion/css";
import * as theme from "../theme";
import {
  NounGridFragment$data,
  NounGridFragment$key,
} from "./__generated__/NounGridFragment.graphql";
import { HStack } from "./VStack";
import { BigNumber } from "ethers";
import { icons } from "../icons/icons";

type Props = {
  dense?: boolean;
  nouns: NounGridFragment$data["nounsRepresented"];
  liquidRepresentation: NounGridFragment$data["liquidRepresentation"];
  totalNouns?: number;
  rows?: number;
} & LayoutProps;

type LayoutProps = {
  columns: number;
  imageSize: keyof typeof theme.spacing;
  gap: keyof typeof theme.spacing;
  overflowFontSize: keyof typeof theme.fontSize;
};

function NounGrid({
  dense,
  nouns,
  liquidRepresentation,
  totalNouns,
  rows,
  columns,
  imageSize,
  gap,
  overflowFontSize,
}: Props) {
  const liquidRepresentationNouns = liquidRepresentation.flatMap(
    (liquidRepresentation) => liquidRepresentation.proxy.nounsRepresented
  );
  const possibleSlots = rows ? rows * columns : nouns.length;
  const imageSizeResolved = theme.spacing[imageSize];

  return (
    <div
      className={cx(
        css`
          display: grid;
          grid-template-columns: repeat(${columns}, ${imageSizeResolved});
          grid-template-rows: repeat(auto-fit, ${imageSizeResolved});
          gap: ${theme.spacing[gap]};
        `,
        css`
          ${dense &&
          css`
            max-width: calc(
              ${imageSizeResolved} *
                ${((possibleSlots + liquidRepresentationNouns.length) * 2) / 3 +
                1}
            );
          `}
        `
      )}
    >
      <NounGridChildren
        dense={dense}
        totalNouns={totalNouns}
        count={possibleSlots}
        nouns={nouns}
        liquidRepresentation={liquidRepresentation}
        imageSize={imageSize}
        overflowFontSize={overflowFontSize}
      />
    </div>
  );
}

type NounsRepresentedGridProps = {
  fragmentKey: NounGridFragment$key;
  rows: number;
  dense?: boolean;
} & LayoutProps;

type NounGridChildrenProps = {
  dense?: boolean;
  count: number;
  nouns: NounGridFragment$data["nounsRepresented"];
  liquidRepresentation: NounGridFragment$data["liquidRepresentation"];
  totalNouns?: number;
  imageSize?: keyof typeof theme.spacing;
  overflowFontSize: keyof typeof theme.fontSize;
  className?: string;
};

export function NounGridChildren({
  dense,
  imageSize,
  totalNouns,
  nouns,
  liquidRepresentation,
  count,
  overflowFontSize,
  className,
}: NounGridChildrenProps) {
  const imageSizeResolved = imageSize ? theme.spacing[imageSize] : undefined;

  const liquidRepresentationNouns = liquidRepresentation.flatMap(
    (liquidRepresentation) => liquidRepresentation.proxy.nounsRepresented
  );

  const length =
    (totalNouns ?? nouns.length) + liquidRepresentationNouns.length;

  const overflowAmount = length - count;

  function nounImageForNoun(
    {
      type,
      noun,
    }: {
      type: "NOUN" | "LIQUID";
      noun: NounGridFragment$data["nounsRepresented"][0];
    },
    index: number,
    dense?: boolean
  ) {
    const isLiquid = (() => {
      switch (type) {
        case "LIQUID":
          return true;

        case "NOUN":
          return false;
      }
    })();

    return (
      <div
        key={index}
        className={cx(
          css`
            position: relative;
            ${imageSizeResolved &&
            css`
              width: ${imageSizeResolved};
              height: ${imageSizeResolved};
            `}
            aspect-ratio: 1/1;
            ${dense &&
            imageSizeResolved &&
            css`
              outline: 2px solid ${theme.colors.white};
              margin-left: calc(${imageSizeResolved} * -0.2 * ${index});
            `}
          `,
          className
        )}
      >
        {isLiquid && (
          <img
            className={css`
              border-radius: ${theme.borderRadius.full};
              border: 2px solid ${theme.colors.white};
              position: absolute;
              bottom: -2px;
              right: -2px;
              width: max(30%, 12px);
            `}
            src={icons.liquid}
            alt="liquid noun symbol"
          />
        )}

        <NounImage
          className={css`
            border-radius: 50%;
          `}
          key={noun.id}
          fragmentRef={noun}
        />
      </div>
    );
  }

  const displayedNouns = [
    ...nouns.map((noun) => ({ type: "NOUN" as const, noun })),
    ...liquidRepresentationNouns.map((noun) => ({
      type: "LIQUID" as const,
      noun,
    })),
  ];

  return overflowAmount > 0 ? (
    <>
      {displayedNouns
        .slice(0, count - 1)
        .map((noun, index) => nounImageForNoun(noun, index, dense))}
      <div
        key="overflowAmount"
        className={cx(
          css`
            min-width: ${imageSizeResolved};
            min-height: ${imageSizeResolved};

            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: ${theme.fontWeight.medium};
            color: ${theme.colors.gray[600]};
            font-size: ${theme.fontSize[overflowFontSize]};
            white-space: nowrap;
            letter-spacing: ${theme.letterSpacing.tight};
            background-color: ${theme.colors.gray[200]};
            border-radius: ${theme.borderRadius.full};
          `,
          css`
            ${dense &&
            css`
              margin-left: calc(${imageSizeResolved} * -0.3 * ${count - 1});
              width: ${imageSizeResolved};
            `}
          `
        )}
      >
        +{overflowAmount + 1}
      </div>
    </>
  ) : (
    <>
      {displayedNouns.map((displayedNoun, index) =>
        nounImageForNoun(displayedNoun, index, dense)
      )}
    </>
  );
}
export function NounsRepresentedGrid({
  fragmentKey,
  dense,
  ...layoutProps
}: NounsRepresentedGridProps) {
  const {
    nounsRepresented,
    liquidRepresentation,
    tokensRepresented: {
      amount: { amount: tokensRepresentedRaw },
    },
  } = useFragment<NounGridFragment$key>(
    graphql`
      fragment NounGridFragment on Delegate {
        tokensRepresented {
          amount {
            amount
          }
        }

        liquidRepresentation(filter: { currentlyActive: true }) {
          # eslint-disable-next-line relay/unused-fields
          proxy {
            nounsRepresented {
              id
              ...NounImageFragment
            }
          }
        }

        nounsRepresented {
          id
          ...NounImageFragment
        }
      }
    `,
    fragmentKey
  );

  const totalNouns = BigNumber.from(tokensRepresentedRaw).toNumber();

  if (!dense && nounsRepresented.length < layoutProps.columns) {
    return (
      <HStack
        justifyContent="space-evenly"
        gap={(Number(layoutProps.gap) + 1).toString() as any}
        className={css`
          padding: ${theme.spacing["4"]};
          max-height: calc(
            ${theme.spacing[layoutProps.imageSize]} * ${layoutProps.rows} +
              ${theme.spacing[layoutProps.gap]} * ${layoutProps.rows - 1}
          );
        `}
      >
        <NounGridChildren
          className={css`
            min-width: ${theme.spacing["8"]};
            flex-basis: ${theme.spacing["24"]};
          `}
          count={layoutProps.columns}
          totalNouns={totalNouns}
          nouns={nounsRepresented}
          liquidRepresentation={liquidRepresentation}
          overflowFontSize={"base"}
        />
      </HStack>
    );
  }

  return (
    <NounGrid
      dense={dense}
      nouns={nounsRepresented}
      liquidRepresentation={liquidRepresentation}
      totalNouns={totalNouns}
      {...layoutProps}
    />
  );
}
