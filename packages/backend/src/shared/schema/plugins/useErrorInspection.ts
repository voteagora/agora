import { Plugin } from "@graphql-yoga/common";
import { responsePathAsArray } from "graphql";

export function useErrorInspection(): Plugin<any> {
  return {
    onResolverCalled({ info }) {
      return ({ result }) => {
        if (result instanceof Error) {
          console.log(result, responsePathAsArray(info.path));
          return result;
        }

        return result;
      };
    },
  };
}
