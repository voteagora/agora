import { DocumentNode, Kind, OperationDefinitionNode } from "graphql/index";

export function getRootOperation(document: DocumentNode) {
  return document.definitions.find(
    (o) => o.kind === Kind.OPERATION_DEFINITION
  ) as OperationDefinitionNode;
}
