import { useQuery } from "@tanstack/react-query";
import { useNounsToken } from "./useNounsToken";

export function useNounsCount() {
  const nounsToken = useNounsToken();
  const { data: totalSupply } = useQuery({
    queryFn: async () => await nounsToken.totalSupply(),
    queryKey: ["nouns-count"],
    suspense: true,
    useErrorBoundary: true,
  });
  return totalSupply!;
}
