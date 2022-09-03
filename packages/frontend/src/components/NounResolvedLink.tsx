import { NounResolvedName } from "./NounResolvedName";

type Props = {
  address: string;
  className?: string;
};

export function NounResolvedLink({ address, className }: Props) {
  return (
    <a href={`https://etherscan.io/address/${address}`} className={className}>
      <NounResolvedName address={address} />
    </a>
  );
}
