import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { NounImage } from "./NounImage";
import { css } from "@emotion/css";
import * as theme from "../theme";
import {
  NounGridFragment$data,
  NounGridFragment$key,
} from "./__generated__/NounGridFragment.graphql";

type Props = {
  nouns: NounGridFragment$data["nounsRepresented"];
} & LayoutProps;

type LayoutProps = {
  rows: number;
  columns: number;
  imageSize: keyof typeof theme.spacing;
  gap: keyof typeof theme.spacing;
  overflowFontSize: keyof typeof theme.fontSize;
};

export function NounGrid({
  nouns,
  rows,
  columns,
  imageSize,
  gap,
  overflowFontSize,
}: Props) {
  const possibleSlots = rows * columns;
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
} & LayoutProps;

type NounGridChildrenProps = {
  count: number;
  nouns: NounGridFragment$data["nounsRepresented"];
  imageSize: keyof typeof theme.spacing;
  overflowFontSize: keyof typeof theme.fontSize;
};

export function NounGridChildren({
  imageSize,
  nouns,
  count,
  overflowFontSize,
}: NounGridChildrenProps) {
  const imageSizeResolved = theme.spacing[imageSize];

  const overflowAmount = nouns.length - count;

  function nounImageForNoun(
    noun: NounGridFragment$data["nounsRepresented"][0]
  ) {
    return (
      <NounImage
        className={css`
          border-radius: 50%;
          width: ${imageSizeResolved};
          height: ${imageSizeResolved};
          aspect-ratio: 1/1;
        `}
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
  const { nounsRepresented } = useFragment<NounGridFragment$key>(
    graphql`
      fragment NounGridFragment on Delegate {
        nounsRepresented {
          id
          ...NounImageFragment
        }
      }
    `,
    fragmentKey
  );

  return <NounGrid nouns={nounsRepresented} {...layoutProps} />;
}
