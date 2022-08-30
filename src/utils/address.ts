// Taken from https://github.com/nounsDAO/nouns-monorepo/blob/0a96001abe99751afa20c41a00adb8e5e32e6fda/packages/nouns-webapp/src/utils/addressAndENSDisplayUtils.ts#L16-L18
export function shortAddress(address: string) {
  return (
    address && [address.slice(0, 4), address.slice(38, 38 + 4)].join("...")
  );
}
