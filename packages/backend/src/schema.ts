import { stitchSchemas } from "@graphql-tools/stitch";
import { getTitleFromProposalDescription } from "./utils/markdown";
import { makeNounsSchema } from "./schemas/nouns-subgraph";
import { AggregateError } from "@graphql-tools/utils";
import { delegateToSchema } from "@graphql-tools/delegate";
import { mergeResolvers } from "@graphql-tools/merge";
import {
  ASTNode,
  FragmentDefinitionNode,
  graphql,
  Kind,
  OperationTypeNode,
  parse,
  print,
  SelectionSetNode,
  visit,
} from "graphql";
import { ethers } from "ethers";
import {
  NNSENSReverseResolver__factory,
  NounsDAOLogicV1__factory,
  NounsToken__factory,
} from "./contracts/generated";
import { Resolvers } from "./generated/types";
import { validateForm } from "./formSchema";
import { WrappedDelegate } from "./model";
import schema from "./schemas/extensions.graphql";

const delegateStatements = new Map<string, ReturnType<typeof validateForm>>([
  [
    "0x2573c60a6d127755aa2dc85e342f7da2378a0cc5",
    {
      address: "0x2573c60a6d127755aa2dc85e342f7da2378a0cc5",
      values: {
        delegateStatement:
          "We are a group of Nounish builders and representatives from launched Nounish NFT extension projects, coming together to participate in Nouns DAO governance.",
        openToSponsoringProposals: null,
        twitter: "nouncil",
        discord: "",
        mostValuableProposals: [
          {
            id: "121",
          },
          {
            id: "87",
          },
          {
            id: "77",
          },
        ],
        leastValuableProposals: [{ id: "127" }, { id: "122" }, { id: "74" }],
        topIssues: [
          {
            type: "proliferation",
            value:
              "Proliferation, above revenue generation, should be the number one focus.",
          },
          {
            type: "treasury",
            value:
              "We believe that active management of the treasury is a distraction.",
          },
        ],
        for: "nouns-agora",
      },
    },
  ],
  [
    "0xc3fdadbae46798cd8762185a09c5b672a7aa36bb",
    {
      address: "0xc3fdadbae46798cd8762185a09c5b672a7aa36bb",
      values: {
        delegateStatement:
          "I am the co-founder of Vector DAO and builder of prop 87. As long time designer and software builder, I plan on using my votes to advocate for and shepard through high quality projects that either creatively proliferate the meme, and contribute software to better functioning of the DAO.",
        for: "nouns-agora",
        twitter: "zhayitong",
        discord: "",

        mostValuableProposals: [
          {
            id: "121",
          },
          {
            id: "87",
          },
          {
            id: "77",
          },
        ],
        leastValuableProposals: [{ id: "127" }, { id: "122" }, { id: "74" }],
        topIssues: [
          {
            type: "proliferation",
            value:
              "Proliferation, above revenue generation, should be the number one focus.",
          },
          {
            type: "treasury",
            value:
              "We believe that active management of the treasury is a distraction.",
          },
        ],
        openToSponsoringProposals: null,
      },
    },
  ],
]);

export async function makeGatewaySchema() {
  const nounsSchema = await makeNounsSchema();

  const provider = new ethers.providers.CloudflareProvider();
  const nounsDaoLogicV1 = NounsDAOLogicV1__factory.connect(
    "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d",
    provider
  );

  const nounsToken = NounsToken__factory.connect(
    "0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03",
    provider
  );

  const resolver = NNSENSReverseResolver__factory.connect(
    "0x5982cE3554B18a5CF02169049e81ec43BFB73961",
    provider
  );

  const typedResolvers: Resolvers = {
    Query: {
      metrics: {
        resolve() {
          return {};
        },
      },

      address: {
        resolve(_, { address }) {
          return { address: address.toLowerCase() };
        },
      },

      async wrappedDelegates(_, args, context, info) {
        function fieldsMatching(
          selectionSetNode: SelectionSetNode,
          name: string
        ) {
          return selectionSetNode.selections.flatMap((field) => {
            if (field.kind === "Field" && field.name.value === name) {
              return [field];
            }

            if (field.kind === "FragmentSpread") {
              return fieldsMatching(
                info.fragments[field.name.value].selectionSet,
                name
              );
            }

            return [];
          });
        }

        function getSelectionSetFromDelegateField() {
          const currentFieldNode = info.fieldNodes.find(
            (node) => node.name.value === info.fieldName
          );
          if (!currentFieldNode) {
            return [];
          }

          const [delegateFieldNode] = fieldsMatching(
            currentFieldNode.selectionSet,
            "delegate"
          );

          if (!delegateFieldNode) {
            return [];
          }

          return delegateFieldNode.selectionSet.selections.filter((node) => {
            if (node.kind === "Field") {
              return node.name.value !== "id";
            }

            return true;
          });
        }

        function buildFusedDelegateQuery(
          delegateFieldSelectionSet: ReturnType<
            typeof getSelectionSetFromDelegateField
          >
        ) {
          const document = parse(`
            query FusedDelegateQuery {
              delegates(
                first: 50
                orderBy: delegatedVotesRaw
                orderDirection: desc
              ) {
                ...DelegateFields
              }
            }

            fragment DelegateFields on Delegate {
              id
            }
          `);

          const patchedDocument = visit(document, {
            [Kind.FRAGMENT_DEFINITION](node) {
              if (node.name.value === "DelegateFields") {
                return {
                  ...node,
                  selectionSet: {
                    ...node.selectionSet,
                    selections: [
                      ...node.selectionSet.selections,
                      ...delegateFieldSelectionSet,
                    ],
                  },
                };
              }

              return node;
            },
          });

          let fragmentMap: Map<string, FragmentDefinitionNode> = new Map<
            string,
            FragmentDefinitionNode
          >();

          function getDefinedFragments(
            astNode: ASTNode,
            fragments: Map<string, FragmentDefinitionNode>
          ) {
            visit(astNode, {
              [Kind.FRAGMENT_SPREAD](node) {
                const name = node.name.value;
                const fragment = info.fragments[name];
                if (!fragment) {
                  return;
                }

                if (fragments.has(name)) {
                  return;
                }

                fragmentMap.set(node.name.value, fragment);
                getDefinedFragments(fragment, fragments);
              },
            });
          }

          getDefinedFragments(patchedDocument, fragmentMap);

          return {
            ...patchedDocument,
            definitions: [
              ...patchedDocument.definitions,
              ...fragmentMap.values(),
            ],
          };
        }

        const delegateFieldSelectionSet = getSelectionSetFromDelegateField();
        const fusedDelegateQuery = buildFusedDelegateQuery(
          delegateFieldSelectionSet
        );

        const fromDelegateStatements = Array.from(
          delegateStatements.keys()
        ).map((address) => ({
          address,
        }));

        const executionResult = await graphql({
          schema: nounsSchema,
          source: print(fusedDelegateQuery),
        });

        if (executionResult.errors) {
          throw new AggregateError(
            executionResult.errors,
            executionResult.errors.map((error) => error.message).join(", \n")
          );
        }

        const remoteDelegates: WrappedDelegate[] = (
          executionResult.data.delegates as any
        ).map((delegate) => ({
          address: delegate.id,
          underlyingDelegate: delegate,
        }));

        const remoteDelegatesSet = new Set(
          remoteDelegates.map((it) => it.address)
        );

        return [
          ...remoteDelegates,
          ...fromDelegateStatements.filter(
            (it) => !remoteDelegatesSet.has(it.address)
          ),
        ];
      },
    },

    OverallMetrics: {
      async totalSupply() {
        return (await nounsToken.totalSupply()).toString();
      },

      async proposalCount() {
        return (await nounsDaoLogicV1.proposalCount()).toString();
      },

      async quorumVotes() {
        return (await nounsDaoLogicV1.quorumVotes()).toString();
      },

      async quorumVotesBPS() {
        return (await nounsDaoLogicV1.quorumVotesBPS()).toString();
      },

      async proposalThreshold() {
        return (await nounsDaoLogicV1.proposalThreshold()).toString();
      },
    },

    Address: {
      resolvedName: {
        resolve({ address }) {
          return { address };
        },
      },

      account({ address }, args, context, info) {
        return delegateToSchema({
          schema: nounsSchema,
          operation: OperationTypeNode.QUERY,
          fieldName: "account",
          args: { id: address },
          context,
          info,
        });
      },

      wrappedDelegate({ address }) {
        return {
          address,
        };
      },
    },

    ResolvedName: {
      async name({ address }) {
        const resolved = await resolver.resolve(address);
        if (!resolved) {
          return null;
        }

        return resolved;
      },
    },

    WrappedDelegate: {
      id({ address }) {
        return address;
      },

      delegate({ address, underlyingDelegate }, args, context, info) {
        if (underlyingDelegate) {
          return underlyingDelegate;
        }

        return delegateToSchema({
          schema: nounsSchema,
          operation: OperationTypeNode.QUERY,
          fieldName: "delegate",
          args: { id: address },
          context,
          info,
        });
      },

      statement({ address }) {
        return delegateStatements.get(address);
      },

      address({ address }) {
        return { address };
      },
    },

    DelegateStatement: {
      statement({ values: { delegateStatement } }) {
        return delegateStatement;
      },

      topIssues({ values: { topIssues } }) {
        return topIssues as any;
      },

      leastValuableProposals({ values: { leastValuableProposals } }) {
        // todo: fetch proposals
        return leastValuableProposals as any;
      },

      mostValuableProposals({ values: { mostValuableProposals } }) {
        // todo: implement
        return mostValuableProposals as any;
      },

      discord({ values: { discord } }) {
        return discord;
      },

      twitter({ values: { twitter } }) {
        return twitter;
      },

      openToSponsoringProposals({ values: { openToSponsoringProposals } }) {
        switch (openToSponsoringProposals) {
          case "yes":
            return true;

          case "no":
            return false;

          default:
            return null;
        }
      },
    },

    Mutation: {
      createNewDelegateStatement: (parent, args, context, info) => {
        const validated = validateForm(
          args.data.statementBodyJson,
          args.data.statementBodyJsonSignature
        );

        delegateStatements.set(validated.address, validated);

        return {
          address: validated.address,
        };
      },
    },
  };

  const resolvers = mergeResolvers([
    typedResolvers,
    {
      Proposal: {
        title: {
          selectionSet: `{ description }`,
          resolve({ description }) {
            return getTitleFromProposalDescription(description);
          },
        },
      },

      Delegate: {
        resolvedName: {
          selectionSet: `{ id }`,
          resolve({ id }) {
            return { address: id };
          },
        },
      },

      Account: {
        address: {
          selectionSet: `{ id }`,
          resolve({ id }) {
            return { address: id.toLowerCase() };
          },
        },
      },
    },
  ]);

  return stitchSchemas({
    subschemas: [nounsSchema],

    typeDefs: schema,

    resolvers,
  });
}
