import { createContext, ReactNode, useContext, useState } from "react";

type PendingVotesContextType = {
  pendingVotes: Map<number, number>;
  setPendingVotes: (
    updaterFn: (oldValue: Map<number, number>) => Map<number, number>
  ) => void;
};

const PendingVotesContext = createContext<PendingVotesContextType | null>(null);

function usePendingVotesContext(): PendingVotesContextType {
  const contextValue = useContext(PendingVotesContext);
  if (!contextValue) {
    throw new Error("PendingVotesContext missing");
  }

  return contextValue;
}

export function usePendingVotes(): Map<number, number> {
  return usePendingVotesContext().pendingVotes;
}

export function useUpdatePendingVotes() {
  return usePendingVotesContext().setPendingVotes;
}

export function PendingVotesProvider({ children }: { children: ReactNode }) {
  const [pendingVotes, setPendingVotes] = useState<Map<number, number>>(
    new Map()
  );

  return (
    <PendingVotesContext.Provider
      value={{
        pendingVotes,
        setPendingVotes,
      }}
    >
      {children}
    </PendingVotesContext.Provider>
  );
}
