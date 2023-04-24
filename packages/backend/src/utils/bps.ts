export function asBps(top: bigint, bottom: bigint): number {
  if (bottom === 0n) {
    return 0;
  }

  return Math.round(Number((top * (100n * 100n)) / bottom));
}

export function bpsOf(bps: number, of: bigint) {
  return (BigInt(bps) * of) / (100n * 100n);
}
