import { useNounsDaoLogicV1 } from "./useNounsDaoLogicV1";
import { useQuery } from "@tanstack/react-query";

export function useQuorumVotes() {
  const dao = useNounsDaoLogicV1();
  const { data: quorumCount } = useQuery({
    queryFn: async () => await dao.quorumVotes(),
    queryKey: ["quorum-votes"],
    suspense: true,
    useErrorBoundary: true,
  });
  return quorumCount!;
}
