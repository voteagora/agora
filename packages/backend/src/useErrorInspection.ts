import { AgoraContextType } from "./model";
import { Plugin } from "@graphql-yoga/common";

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
