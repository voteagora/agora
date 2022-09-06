import { FragmentDefinitionNode, SelectionSetNode } from "graphql";
import { ObjMap } from "graphql/jsutils/ObjMap";

export function fieldsMatching(
  selectionSetNode: SelectionSetNode,
  name: string,
  fragments: ObjMap<FragmentDefinitionNode>
) {
  return selectionSetNode.selections.flatMap((field) => {
    if (field.kind === "Field" && field.name.value === name) {
      return [field];
    }

    if (field.kind === "FragmentSpread") {
      return fieldsMatching(
        fragments[field.name.value].selectionSet,
        name,
        fragments
      );
    }

    return [];
  });
}
