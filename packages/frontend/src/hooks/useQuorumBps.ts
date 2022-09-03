import { useNounsDaoLogicV1 } from "./useNounsDaoLogicV1";
import { useQuery } from "@tanstack/react-query";

export function useQuorumBps() {
  const dao = useNounsDaoLogicV1();
  const { data: quorumVotesBps } = useQuery({
    queryFn: async () => await dao.quorumVotesBPS(),
    queryKey: ["quorum-bps"],
    suspense: true,
    useErrorBoundary: true,
  });
  return quorumVotesBps!;
}
