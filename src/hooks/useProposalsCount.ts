import { useNounsDaoLogicV1 } from "./useNounsDaoLogicV1";
import { useQuery } from "@tanstack/react-query";

export function useProposalsCount() {
  const dao = useNounsDaoLogicV1();
  const { data: proposalsCount } = useQuery({
    queryFn: async () => await dao.proposalCount(),
    queryKey: ["proposals-count"],
    suspense: true,
    useErrorBoundary: true,
  });
  return proposalsCount!;
}
