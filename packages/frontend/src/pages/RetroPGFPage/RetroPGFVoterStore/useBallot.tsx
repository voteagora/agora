import { useState } from "react";
import { Ballot, useRetroPGFVoterStore } from "./RetroPGFVoterStoreContext";

export const useBallot = () => {
  const { state, dispatch } = useRetroPGFVoterStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);

  const addProject = async (projectId: string, amount: string) => {
    const { votes } = await refetchBallot();
    dispatch({ type: "ADD_PROJECT", projectId, amount });

    setIsSaving(true);
    if (!state.votes.find((project) => project.projectId === projectId)) {
      const res = await saveBallot([...votes, { projectId, amount }]);
      if (!res) {
        setIsError(true);
      }
      setIsSaving(false);
    }
  };

  const addProjects = async (projects: Ballot) => {
    const { votes } = await refetchBallot();
    dispatch({ type: "ADD_PROJECTS", projects });

    setIsSaving(true);
    const res = await saveBallot([
      ...votes.filter(
        (project) =>
          !projects.some(
            (projectToAdd) => project.projectId === projectToAdd.projectId
          )
      ),
      ...projects,
    ]);
    if (!res) {
      setIsError(true);
    }
    setIsSaving(false);
  };

  const updateProject = async (projectId: string, amount: string) => {
    const { votes } = await refetchBallot();
    dispatch({ type: "UPDATE_PROJECT", projectId, amount });

    setIsSaving(true);
    const res = await saveBallot(
      votes.map((project) =>
        project.projectId === projectId
          ? { ...project, amount: amount }
          : project
      )
    );
    if (!res) {
      setIsError(true);
    }
    setIsSaving(false);
  };

  const removeProject = async (projectId: string) => {
    const { votes } = await refetchBallot();
    dispatch({ type: "REMOVE_PROJECT", projectId });

    setIsSaving(true);
    const res = await saveBallot(
      votes.filter((project) => project.projectId !== projectId)
    );
    if (!res) {
      setIsError(true);
    }
    setIsSaving(false);
  };

  const removeProjects = async (projectIds: string[]) => {
    const { votes } = await refetchBallot();
    dispatch({ type: "REMOVE_PROJECTS", projectIds });

    setIsSaving(true);
    const res = await saveBallot(
      votes.filter(
        (project) => !projectIds.some((id) => id === project.projectId)
      )
    );
    if (!res) {
      setIsError(true);
    }
    setIsSaving(false);
  };

  const saveProjects = async (
    projectsToAdd: Ballot,
    projectsToRemove: string[]
  ) => {
    const { votes } = await refetchBallot();
    dispatch({ type: "REMOVE_PROJECTS", projectIds: projectsToRemove });
    dispatch({ type: "ADD_PROJECTS", projects: projectsToAdd });

    setIsSaving(true);
    const ballot = [
      ...votes.filter(
        (project) =>
          !projectsToRemove.some((id) => id === project.projectId) &&
          !projectsToAdd.some(
            (projectToAdd) => project.projectId === projectToAdd.projectId
          )
      ),
      ...projectsToAdd,
    ];

    const res = await saveBallot(ballot);
    if (!res) {
      setIsError(true);
    }
    setIsSaving(false);
  };

  const setSignature = (signature: string) => {
    dispatch({ type: "SET_SIGNATURE", signature });
  };

  const doesBallotContainProject = (projectId: string) => {
    return state.votes.some((project) => project.projectId === projectId);
  };

  const projectAllocaiton = (projectId: string) => {
    const project = state.votes.find(
      (project) => project.projectId === projectId
    );
    if (project) {
      return project.amount;
    } else {
      return "";
    }
  };

  const ballotValue = state.votes.reduce(
    (acc, project) => acc + Number(project.amount),
    0
  );

  const refetchBallot = async () => {
    const { votes, signature } = await fetchBallot();
    dispatch({ type: "SET_BALLOT", ballot: votes });
    dispatch({ type: "SET_SIGNATURE", signature });
    return { votes, signature } as { votes: Ballot; signature: string };
  };

  return {
    ballot: state.votes,
    signature: state.signature,
    isSaving,
    isError,
    ballotValue,
    addProject,
    addProjects,
    updateProject,
    removeProject,
    removeProjects,
    saveProjects,
    setSignature,
    doesBallotContainProject,
    projectAllocaiton,
    refetchBallot,
  };
};

async function saveBallot(ballot: Ballot) {
  try {
    const result = await fetch("/api/ballot/save", {
      method: "POST",
      body: JSON.stringify({
        votes: ballot,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    if (result.ok) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function fetchBallot() {
  try {
    const res = await fetch("/api/ballot", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    if (res.status === 200) {
      const data = await res.json();
      if (data.votes) {
        return { votes: data.votes, signature: data.signature };
      }
    }
    return { votes: [], signature: "" };
  } catch (e) {
    console.error(e);
    return { votes: [], signature: "" };
  }
}
