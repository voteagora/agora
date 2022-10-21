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

type Props = {
  nouns: NounGridFragment$data["nounsRepresented"];
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
  nouns,
  totalNouns,
  rows,
  columns,
  imageSize,
  gap,
  overflowFontSize,
}: Props) {
  const possibleSlots = rows ? rows * columns : nouns.length;
  const imageSizeResolved = theme.spacing[imageSize];

  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: repeat(${columns}, ${imageSizeResolved});
        grid-template-rows: repeat(auto-fit, ${imageSizeResolved});
        gap: ${theme.spacing[gap]};
      `}
    >
      <NounGridChildren
        totalNouns={totalNouns}
        count={possibleSlots}
        nouns={nouns}
        imageSize={imageSize}
        overflowFontSize={overflowFontSize}
      />
    </div>
  );
}

type NounsRepresentedGridProps = {
  fragmentKey: NounGridFragment$key;
  rows: number;
} & LayoutProps;

type NounGridChildrenProps = {
  count: number;
  nouns: NounGridFragment$data["nounsRepresented"];
  totalNouns?: number;
  imageSize?: keyof typeof theme.spacing;
  overflowFontSize: keyof typeof theme.fontSize;
  className?: string;
};

export function NounGridChildren({
  imageSize,
  totalNouns,
  nouns,
  count,
  overflowFontSize,
  className,
}: NounGridChildrenProps) {
  const imageSizeResolved = imageSize ? theme.spacing[imageSize] : undefined;

  const length = totalNouns ?? nouns.length;

  const overflowAmount = length - count;

  function nounImageForNoun(
    noun: NounGridFragment$data["nounsRepresented"][0]
  ) {
    return (
      <NounImage
        className={cx(
          css`
            border-radius: 50%;
            ${imageSizeResolved &&
            css`
              width: ${imageSizeResolved};
              height: ${imageSizeResolved};
            `}
            aspect-ratio: 1/1;
          `,
          className
        )}
        key={noun.id}
        fragmentRef={noun}
      />
    );
  }

  return overflowAmount > 0 ? (
    <>
      {nouns.slice(0, count - 1).map(nounImageForNoun)}
      <div
        key="overflowAmount"
        className={css`
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
        `}
      >
        +{overflowAmount + 1}
      </div>
    </>
  ) : (
    <>{nouns.map(nounImageForNoun)}</>
  );
}

export function NounsRepresentedGrid({
  fragmentKey,
  ...layoutProps
}: NounsRepresentedGridProps) {
  const { nounsRepresented, delegatedVotesRaw } =
    useFragment<NounGridFragment$key>(
      graphql`
        fragment NounGridFragment on Delegate {
          delegatedVotesRaw

          nounsRepresented {
            id
            ...NounImageFragment
          }
        }
      `,
      fragmentKey
    );

  const totalNouns = Number(delegatedVotesRaw);

  if (nounsRepresented.length < layoutProps.columns) {
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
          overflowFontSize={"base"}
        />
      </HStack>
    );
  }

  return (
    <NounGrid
      nouns={nounsRepresented}
      totalNouns={totalNouns}
      {...layoutProps}
    />
  );
}
