import { useFragment } from "react-relay";
import { NounImageFragment$key } from "./__generated__/NounImageFragment.graphql";
import graphql from "babel-plugin-relay/macro";
import { useMemo } from "react";
import { buildSVG } from "@nouns/sdk/dist/image/svg-builder";
import { getNounData, ImageData } from "@nouns/assets";

type Props = {
  className: string;
  fragmentRef: NounImageFragment$key;
};

export function NounImage({ fragmentRef, className }: Props) {
  const { number, seed } = useFragment<NounImageFragment$key>(
    graphql`
      fragment NounImageFragment on Noun {
        number

        seed {
          accessory
          background
          body
          glasses
          head
        }
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

  return <img className={className} src={nounSvg} alt={`noun #${number}`} />;
}
