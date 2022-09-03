import { useNounsDaoLogicV1 } from "./useNounsDaoLogicV1";
import { useQuery } from "@tanstack/react-query";

export function useProposalThreshold() {
  const dao = useNounsDaoLogicV1();
  const { data: proposalThreshold } = useQuery({
    queryFn: async () => await dao.proposalThreshold(),
    queryKey: ["proposal-threshold"],
    suspense: true,
    useErrorBoundary: true,
  });
  return proposalThreshold!;
}
