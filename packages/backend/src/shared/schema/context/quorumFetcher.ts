export type QuorumFetcher = {
  fetchQuorum(proposalId?: bigint): Promise<bigint> | bigint;
};

export type QuorumFetcherDeps = {
  quorumFetcher: QuorumFetcher;
};
