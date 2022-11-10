import { cx } from "@emotion/css";
import { css } from "@emotion/css";
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

  return (
    <div
      className={cx(
        className,
        css`
          overflow: hidden;
        `
      )}
    >
      <div
        className={cx(
          css`
            background: #eee;
            width: 100%;
            height: 100%;
          `
        )}
      >
        {!isHidden && src && (
          <img
            className={css`
              @keyframes fade-in {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }

              animation: 0.3s forwards fade-in;
            `}
            src={src}
            onError={() => setIsHidden(true)}
          />
        )}
      </div>
    </div>
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
