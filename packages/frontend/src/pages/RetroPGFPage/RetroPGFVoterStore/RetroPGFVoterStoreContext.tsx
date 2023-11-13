import { useSIWE } from "connectkit";
import React, { ReactNode, useContext, useEffect, useReducer } from "react";

export type Ballot = Array<{ projectId: string; amount: string }>;
export type Likes = Map<string, Array<string>>;

type Action =
  | { type: "SET_BALLOT"; ballot: Ballot }
  | { type: "ADD_PROJECT"; projectId: string; amount: string }
  | { type: "ADD_PROJECTS"; projects: Ballot }
  | { type: "UPDATE_PROJECT"; projectId: string; amount: string }
  | { type: "REMOVE_PROJECT"; projectId: string }
  | { type: "REMOVE_PROJECTS"; projectIds: string[] }
  | { type: "SET_SIGNATURE"; signature: string }
  | { type: "SET_LIKES"; likes: Likes }
  | { type: "LIKE"; listId: string; address: string }
  | { type: "UNLIKE"; listId: string; address: string };

type CitizenState = {
  votes: Ballot;
  likes: Likes;
  signature?: string;
};

const RetroPGFVoterStoreContext = React.createContext<
  { state: CitizenState; dispatch: React.Dispatch<Action> } | undefined
>(undefined);

const appReducer = (state: CitizenState, action: Action): CitizenState => {
  switch (action.type) {
    case "SET_BALLOT":
      return { ...state, votes: action.ballot };
    case "ADD_PROJECT":
      if (
        state.votes.find((project) => project.projectId === action.projectId)
      ) {
        return state;
      }
      return {
        ...state,
        votes: [
          ...state.votes,
          { projectId: action.projectId, amount: action.amount },
        ],
      };
    case "ADD_PROJECTS":
      const votes = state.votes.filter(
        (project) =>
          !action.projects.some(
            (projectToAdd) => project.projectId === projectToAdd.projectId
          )
      );
      return {
        ...state,
        votes: [...votes, ...action.projects],
      };
    case "UPDATE_PROJECT":
      return {
        ...state,
        votes: state.votes.map((project) =>
          project.projectId === action.projectId
            ? { ...project, amount: action.amount }
            : project
        ),
      };
    case "REMOVE_PROJECT":
      return {
        ...state,
        votes: state.votes.filter(
          (project) => project.projectId !== action.projectId
        ),
      };
    case "REMOVE_PROJECTS":
      return {
        ...state,
        votes: state.votes.filter(
          (project) => !action.projectIds.includes(project.projectId)
        ),
      };
    case "SET_SIGNATURE":
      return { ...state, signature: action.signature };

    case "SET_LIKES":
      return { ...state, likes: action.likes };
    case "LIKE":
      const listToLike = state.likes.get(action.listId) || [];
      if (listToLike.includes(action.address)) {
        return state;
      }
      const newListToLike = [...listToLike, action.address];

      return {
        ...state,
        likes: new Map(state.likes.set(action.listId, newListToLike)),
      };

    case "UNLIKE":
      const listToUnlike = state.likes.get(action.listId) || [];
      const newListToUnlike = listToUnlike.filter(
        (userId) => userId !== action.address
      );

      return {
        ...state,
        likes: new Map(state.likes.set(action.listId, newListToUnlike)),
      };
  }
};

export const RetroPGFVoterStoreProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(appReducer, {
    votes: [],
    likes: new Map(),
  });

  const { isSignedIn } = useSIWE();

  useEffect(() => {
    if (isSignedIn) {
      // Fetch data for authenticated user and set it in state.
      fetch("/api/ballot", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }).then(async (res) => {
        if (res.status === 200) {
          const data = await res.json();
          if (data.votes) {
            dispatch({ type: "SET_BALLOT", ballot: data.votes });
            dispatch({ type: "SET_SIGNATURE", signature: data.signature });
          }
        }
      });
    }

    fetch("/api/likes").then(async (res) => {
      if (res.status === 200) {
        const data = await res.json();
        if (data) {
          dispatch({ type: "SET_LIKES", likes: new Map(Object.entries(data)) });
        }
      }
    });
  }, [isSignedIn]);

  return (
    <RetroPGFVoterStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </RetroPGFVoterStoreContext.Provider>
  );
};

export const useRetroPGFVoterStore = () => {
  const context = useContext(RetroPGFVoterStoreContext);

  if (!context) {
    throw new Error(
      "useRetroPGFVoterStore must be used within an RetroPGFVoterStoreProvider"
    );
  }

  return context;
};
