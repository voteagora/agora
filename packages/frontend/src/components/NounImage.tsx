import { useFragment, graphql } from "react-relay";
import { useMemo } from "react";
import { buildSVG } from "@nouns/sdk/dist/image/svg-builder";
import { getNounData, ImageData } from "@nouns/assets";
import { BigNumber } from "ethers";

import { NounImageFragment$key } from "./__generated__/NounImageFragment.graphql";

type Props = {
  className: string;
  fragmentRef: NounImageFragment$key;
};

export function NounImage({ fragmentRef, className }: Props) {
  const { tokenId, ...seed } = useFragment<NounImageFragment$key>(
    graphql`
      fragment NounImageFragment on Noun {
        tokenId
        accessory
        background
        body
        glasses
        head
      }
    `,
    fragmentRef
  );

  const nounSvg = useMemo(() => {
    if (!seed) {
      return "";
    }

    const nounData = getNounData({
      body: seed.body,
      glasses: seed.glasses,
      head: seed.head,
      accessory: seed.accessory,
      background: seed.background,
    });

    const imageRaw = buildSVG(
      nounData.parts,
      ImageData.palette,
      nounData.background
    );

    return `data:image/svg+xml;base64,${btoa(imageRaw)}`;
  }, [seed]);

  const title = `noun #${BigNumber.from(tokenId).toString()}`;

  return <img className={className} src={nounSvg} alt={title} title={title} />;
}
