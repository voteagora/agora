import { cx } from "@emotion/css";
import { css } from "@emotion/css";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import avatar0 from "./avatar0.svg";
import avatar1 from "./avatar1.svg";
import avatar2 from "./avatar2.svg";
import avatar3 from "./avatar3.svg";
import avatar4 from "./avatar4.svg";
import avatar5 from "./avatar5.svg";
import avatar6 from "./avatar6.svg";
import avatar7 from "./avatar7.svg";

export type Props = {
  src: string | null;
  className: string;
  name: string | null;
};

export function SuspenseImage({ className, src, name }: Props) {
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

  const avatars = [
    avatar0,
    avatar1,
    avatar2,
    avatar3,
    avatar4,
    avatar5,
    avatar6,
    avatar7,
  ];

  const thisAvatar =
    avatars[!name ? 0 : (name.charCodeAt(0) % 97) % avatars.length];

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
            background: #fff;
            width: 100%;
            height: 100%;
          `
        )}
      >
        {!isHidden && src && (
          <img
            alt="ENS Avatar"
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

        <img alt="Avatar" src={thisAvatar} />
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
