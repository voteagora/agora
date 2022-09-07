import { stitchSchemas } from "@graphql-tools/stitch";
import {
  extractFirstParagraph,
  getTitleFromProposalDescription,
} from "./utils/markdown";
import { makeNounsSchema } from "./schemas/nouns-subgraph";
import { delegateToSchema } from "@graphql-tools/delegate";
import { mergeResolvers } from "@graphql-tools/merge";
import {
  FieldNode,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLResolveInfo,
  Kind,
  OperationTypeNode,
  SelectionNode,
} from "graphql";
import { BigNumber, ethers } from "ethers";
import {
  NNSENSReverseResolver__factory,
  NounsDAOLogicV1__factory,
  NounsToken__factory,
} from "./contracts/generated";
import {
  Delegate_OrderBy,
  OrderDirection,
  QueryDelegatesArgs,
  Resolvers,
  WrappedDelegatesOrder,
  WrappedDelegatesWhere,
} from "./generated/types";
import { validateForm } from "./formSchema";
import { WrappedDelegate } from "./model";
import schema from "./schemas/extensions.graphql";
import { fieldsMatching } from "./utils/graphql";
import { parseSelectionSet } from "@graphql-tools/utils";
import { ascendingValueComparator } from "./utils/sorting";
import { marked } from "marked";

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
        discord: "yitong#9038",

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

function makeSimpleFieldNode(name: string): FieldNode {
  return {
    kind: Kind.FIELD,
    name: {
      kind: Kind.NAME,
      value: name,
    },
  };
}

function makeDelegateResolveInfo(
  info: GraphQLResolveInfo,
  injectedSelections: ReadonlyArray<SelectionNode>
): GraphQLResolveInfo {
  const additionalSelections: SelectionNode[] = [
    makeSimpleFieldNode("id"),
    ...injectedSelections,
  ];

  const parentType = (
    (
      (info.returnType as GraphQLNonNull<GraphQLObjectType>).ofType.getFields()[
        "edges"
      ].type as GraphQLNonNull<GraphQLList<GraphQLNonNull<GraphQLObjectType>>>
    ).ofType.ofType.ofType.getFields()["node"]
      .type as GraphQLNonNull<GraphQLObjectType>
  ).ofType;

  const existingFieldNodes: FieldNode[] = info.fieldNodes
    .flatMap((field): FieldNode[] => {
      if (field.kind !== "Field" || field.name.value !== "wrappedDelegates") {
        return [];
      }

      return [field];
    })
    .flatMap((field) =>
      fieldsMatching(field.selectionSet, "edges", info.fragments)
    )
    .flatMap((field) =>
      fieldsMatching(field.selectionSet, "node", info.fragments)
    )
    .flatMap((field) =>
      fieldsMatching(field.selectionSet, "delegate", info.fragments)
    );

  const fieldNode =
    existingFieldNodes[0] ??
    ({
      kind: Kind.FIELD,
      name: {
        kind: Kind.NAME,
        value: "delegate",
      },
    } as FieldNode);

  function addSelectionsToFieldNode(
    field: FieldNode,
    selections: SelectionNode[]
  ) {
    return {
      ...field,
      selectionSet: {
        ...field.selectionSet,
        selections: [...(field.selectionSet?.selections ?? []), ...selections],
      },
    };
  }

  return {
    ...info,
    fieldName: "delegate",
    fieldNodes: [addSelectionsToFieldNode(fieldNode, additionalSelections)],
    returnType: parentType.getFields()["delegate"].type,
    path: {
      prev: undefined,
      typename: "WrappedDelegate",
      key: "delegate",
    },
  };
}

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

  async function fetchRemoteDelegates(
    context: any,
    args: QueryDelegatesArgs,
    info: GraphQLResolveInfo,
    injectedSelections: ReadonlyArray<SelectionNode> = []
  ) {
    const result = await delegateToSchema({
      schema: nounsSchema,
      operation: OperationTypeNode.QUERY,
      fieldName: "delegates",
      args,
      context,
      info: makeDelegateResolveInfo(info, injectedSelections),
    });

    if (result instanceof Error) {
      throw result;
    }

    return result;
  }

  function parseSelection(input: string) {
    return parseSelectionSet(input, { noLocation: true }).selections;
  }

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

      async wrappedDelegates(
        _,
        { where, orderBy, first, after },
        context,
        info
      ) {
        const selectionsForOrdering = (() => {
          switch (orderBy) {
            case WrappedDelegatesOrder.MostRecentlyActive:
              return parseSelection(
                `
                  {
                    votes(first: 1, orderBy: blockNumber, orderDirection:desc) {
                      id
                      blockNumber
                    }
                    
                    proposals(first: 1, orderBy: createdBlock, orderDirection: desc) {
                      id
                      createdBlock
                    }
                  }
                `
              );

            case WrappedDelegatesOrder.MostNounsRepresented:
            default:
              return [];
          }
        })();

        const selectionsForWhere = (() => {
          switch (where) {
            case WrappedDelegatesWhere.SeekingDelegation:
              return parseSelection(`{ delegatedVotes }`);

            case WrappedDelegatesWhere.WithStatement:
            default:
              return [];
          }
        })();

        const queryDelegatesArgs: QueryDelegatesArgs = {
          orderBy: Delegate_OrderBy.DelegatedVotes,
          orderDirection: OrderDirection.Desc,
          first: 1000,
        };

        const remoteDelegates = await fetchRemoteDelegates(
          context,
          queryDelegatesArgs,
          info,
          [...selectionsForOrdering, ...selectionsForWhere]
        );

        const remoteDelegateSet = new Set(remoteDelegates.map(({ id }) => id));

        const delegates = [
          ...remoteDelegates.map((delegatedDelegate) => {
            const delegateStatement = delegateStatements.get(
              delegatedDelegate.id
            );

            return {
              id: delegatedDelegate.id,
              delegateStatement: delegateStatement?.values,
              delegatedDelegate,
            };
          }),
          ...Array.from(delegateStatements.values()).flatMap(
            (delegateStatement) => {
              if (remoteDelegateSet.has(delegateStatement.address)) {
                return [];
              }

              return {
                id: delegateStatement.address,
                delegateStatement: delegateStatement.values,
                delegatedDelegate: null,
              };
            }
          ),
        ];

        const filteredDelegates = (() => {
          switch (where) {
            case WrappedDelegatesWhere.SeekingDelegation:
              return delegates.filter((delegate) => {
                if (!delegate.delegatedDelegate) {
                  return true;
                }

                return (
                  BigNumber.from(
                    delegate.delegatedDelegate.delegatedVotes
                  ).isZero() && delegate.delegateStatement
                );
              });

            case WrappedDelegatesWhere.WithStatement: {
              return delegates.filter(
                (delegate) => !!delegate.delegateStatement
              );
            }

            default: {
              return delegates;
            }
          }
        })();

        const sortedDelegates = (() => {
          switch (orderBy) {
            case WrappedDelegatesOrder.MostRecentlyActive:
              return filteredDelegates.slice().sort(
                ascendingValueComparator((delegate) => {
                  if (!delegate.delegatedDelegate) {
                    return -Infinity;
                  }

                  const latestVote =
                    delegate.delegatedDelegate?.votes?.[0]?.blockNumber ??
                    -Infinity;

                  const latestProposal =
                    delegate.delegatedDelegate?.proposals?.[0]?.createdBlock ??
                    -Infinity;

                  return Math.max(latestVote, latestProposal);
                })
              );

            case WrappedDelegatesOrder.MostNounsRepresented:
            default:
              return filteredDelegates;
          }
        })();

        const parsedAfter = parseInt(after);
        const offset = isNaN(parsedAfter) ? 0 : parsedAfter + 1;
        const count = first;

        const edges = sortedDelegates
          .map((node, index) => ({
            node: {
              address: node.id,
              underlyingDelegate: node.delegatedDelegate,
            },
            cursor: `${index}`,
          }))
          .slice(offset, offset + count);

        return {
          edges,
          pageInfo: {
            count: sortedDelegates.length,
            hasPreviousPage: offset > 0,
            hasNextPage: offset + count < sortedDelegates.length,
            startCursor: `${edges[0].cursor}`,
            endCursor: `${edges[edges.length - 1].cursor}`,
          },
        };
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
      summary({ values: { delegateStatement } }) {
        return extractFirstParagraph(
          marked.lexer(delegateStatement.slice(0, 1000))
        )?.slice(0, 260);
      },

      statement({ values: { delegateStatement } }) {
        return delegateStatement;
      },

      topIssues({ values: { topIssues } }) {
        return topIssues as any;
      },

      async leastValuableProposals(
        { values: { leastValuableProposals } },
        args,
        context,
        info
      ) {
        return Promise.all(
          leastValuableProposals.map((proposal) =>
            delegateToSchema({
              schema: nounsSchema,
              operation: OperationTypeNode.QUERY,
              fieldName: "proposal",
              args: { id: proposal.id },
              context,
              returnType: (
                (info.returnType as GraphQLNonNull<any>)
                  .ofType as GraphQLList<any>
              ).ofType,
              info,
            })
          )
        );
      },

      async mostValuableProposals(
        { values: { mostValuableProposals } },
        args,
        context,
        info
      ) {
        return Promise.all(
          mostValuableProposals.map((proposal) =>
            delegateToSchema({
              schema: nounsSchema,
              operation: OperationTypeNode.QUERY,
              fieldName: "proposal",
              args: { id: proposal.id },
              context,
              returnType: (
                (info.returnType as GraphQLNonNull<any>)
                  .ofType as GraphQLList<any>
              ).ofType,
              info,
            })
          )
        );
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

        totalValue: {
          selectionSet: `{ values }`,
          resolve({ values }: { values: string[] }) {
            return (
              values?.reduce<BigNumber>(
                (acc, value) => BigNumber.from(value).add(acc),
                BigNumber.from(0)
              ) ?? BigNumber.from(0)
            ).toString();
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

        voteSummary: {
          selectionSet: `{ votes(first: 1000) { supportDetailed } }`,
          resolve({ votes }) {
            return votes.reduce(
              (acc, { supportDetailed }) => {
                switch (supportDetailed) {
                  case 0:
                    return { ...acc, againstVotes: acc.againstVotes + 1 };
                  case 1:
                    return { ...acc, forVotes: acc.forVotes + 1 };
                  case 2:
                    return { ...acc, abstainVotes: acc.abstainVotes + 1 };
                }
              },
              {
                forVotes: 0,
                againstVotes: 0,
                abstainVotes: 0,
              }
            );
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
