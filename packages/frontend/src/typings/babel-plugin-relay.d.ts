declare module "babel-plugin-relay/macro" {
  import { GraphQLTaggedNode } from "relay-runtime";

  declare function graphql(
    literals: TemplateStringsArray,
    ...placeholders: any[]
  ): GraphQLTaggedNode;

  export default graphql;
}
