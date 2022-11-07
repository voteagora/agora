import { useQuery } from "@tanstack/react-query";
import { useProvider } from "wagmi";

type Props = {
  addressOrName: string;
  className: string;
};

export function ENSAvatar({ addressOrName, className }: Props) {
  return null;
  // const provider = useProvider();

  // const image = useQuery({
  //   queryKey: ["ens-avatar", addressOrName],
  //   suspense: true,
  //   useErrorBoundary: false,
  //   async queryFn() {
  //     const avatar = await provider.getAvatar(addressOrName);
  //     if (!avatar) {
  //       return null;
  //     }

  //     try {
  //       await fetchImage(avatar);
  //     } catch (e) {
  //       return null;
  //     }

  //     return avatar;
  //   },
  // });

  // if (!image.data) {
  //   return null;
  // }

  // return <img src={image.data} className={className} />;
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
