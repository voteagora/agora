import { useSIWE } from "connectkit";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useRetroPGFVoterStore } from "./RetroPGFVoterStoreContext";

export const useLikes = () => {
  const { state, dispatch } = useRetroPGFVoterStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);

  const { address } = useAccount();
  const { isSignedIn } = useSIWE();

  const isListLiked = (listId: string) => {
    const list = state.likes.get(listId);
    if (list && address) {
      return list.includes(address);
    }
    return false;
  };

  const likeList = async (listId: string) => {
    if (isSignedIn && address) {
      if (isListLiked(listId)) {
        dispatch({ type: "UNLIKE", listId, address });
      } else {
        dispatch({ type: "LIKE", listId, address });
      }

      setIsSaving(true);
      const res = await saveLike(listId);
      if (!res) {
        setIsError(true);
      }
      setIsSaving(false);
    }
  };

  const likesForList = (listId: string) => {
    const list = state.likes.get(listId);
    if (list) {
      return list.length;
    }
    return 0;
  };

  return {
    likes: state.likes,
    isSaving,
    isError,
    likesForList,
    likeList,
    isListLiked,
  };
};

async function saveLike(listId: string) {
  try {
    const result = await fetch(
      `${process.env.PUBLIC_URL}/api/likes/${listId}/like`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );
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
