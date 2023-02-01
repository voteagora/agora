import { Plugin } from "@graphql-yoga/common";
import { AgoraContextType } from "../context";

export function useErrorInspection(): Plugin<AgoraContextType> {
  return {
    onResolverCalled({ info, context }) {
      return ({ result }) => {
        if (result instanceof Error) {
          console.log(result, info.path);
          return result;
        }

        return result;
      };
    },
  };
}
