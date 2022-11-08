import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export type Props = {
  src: string | null;
  className: string;
};

export function SuspenseImage({ className, src }: Props) {
  const [isHidden, setIsHidden] = useState(false);
  useQuery({
    queryKey: ["suspense-image", src],
    suspense: false,
    useErrorBoundary: false,
    async queryFn() {
      if (!src) {
        return null;
      }

      try {
        await fetchImage(src);
      } catch (e) {
        return null;
      }

      return src;
    },
  });

  if (!src) {
    return null;
  }

  if (isHidden) {
    return null;
  }

  return (
    <img src={src} className={className} onError={() => setIsHidden(true)} />
  );
}

function fetchImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = src;

  return new Promise((resolve, reject) => {
    image.onload = (e) => {
      resolve(image);
    };

    image.onerror = (e) => {
      reject(e);
    };
  });
}
