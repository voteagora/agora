import { Metrics } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

export function getMetrics(): Metrics {
  const loaded = Metrics.load("METRICS");
  if (loaded) {
    return loaded;
  }

  const newMetrics = new Metrics("METRICS");
  newMetrics.totalSupply = BigInt.zero();
  newMetrics.quorumNumerator = BigInt.zero();
  newMetrics.delegatedSupply = BigInt.zero();
  return newMetrics;
}
