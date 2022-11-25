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
  dense?: boolean;
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
  dense,
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
              ${imageSizeResolved} * ${(possibleSlots * 2) / 3 + 1}
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
  count,
  overflowFontSize,
  className,
}: NounGridChildrenProps) {
  const imageSizeResolved = imageSize ? theme.spacing[imageSize] : undefined;

  const length = totalNouns ?? nouns.length;

  const overflowAmount = length - count;

  function nounImageForNoun(
    noun: NounGridFragment$data["nounsRepresented"][0],
    index: number,
    dense?: boolean
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
            ${dense &&
            imageSizeResolved &&
            css`
              margin-left: calc(${imageSizeResolved} * -0.3 * ${index});
            `}
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
      {nouns
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
    <>{nouns.map((noun, index) => nounImageForNoun(noun, index, dense))}</>
  );
}

export function NounsRepresentedGrid({
  fragmentKey,
  dense,
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
          overflowFontSize={"base"}
        />
      </HStack>
    );
  }

  return (
    <NounGrid
      dense={dense}
      nouns={nounsRepresented}
      totalNouns={totalNouns}
      {...layoutProps}
    />
  );
}
