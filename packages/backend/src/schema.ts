import { stitchSchemas } from "@graphql-tools/stitch";
import { mapSchema, MapperKind } from "@graphql-tools/utils";
import {
  extractFirstParagraph,
  getTitleFromProposalDescription,
} from "./utils/markdown";
import { makeNounsSchema } from "./schemas/nouns-subgraph";
import { delegateToSchema } from "@graphql-tools/delegate";
import { mergeResolvers } from "@graphql-tools/merge";
import {
  defaultFieldResolver,
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
import { formSchema } from "./formSchema";
import { AgoraContextType, WrappedDelegate } from "./model";
import schema from "./schemas/extensions.graphql";
import { fieldsMatching } from "./utils/graphql";
import { parseSelectionSet } from "@graphql-tools/utils";
import { descendingValueComparator, flipComparator } from "./utils/sorting";
import { marked } from "marked";
import { resolveEnsOrNnsName } from "./utils/resolveName";
import { validateSigned } from "./utils/signing";
import {
  fetchWithCache,
  makeDefinitionWithFixedTtl,
  makeSimpleCacheDefinition,
} from "./utils/cache";

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

  return {
    ...info,
    fieldName: "delegate",
    fieldNodes: [
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: "delegate",
        },
        selectionSet: {
          kind: Kind.SELECTION_SET,
          selections: [
            ...existingFieldNodes.flatMap(
              (field) => field.selectionSet.selections
            ),
            ...additionalSelections,
          ],
        },
      },
    ],
    returnType: parentType.getFields()["delegate"].type,
    path: {
      prev: undefined,
      typename: "WrappedDelegate",
      key: "delegate",
    },
  };
}

export function makeGatewaySchema() {
  const nounsSchema = makeNounsSchema();

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

  const resolvedNameCacheDef = makeDefinitionWithFixedTtl<
    { resolvedName: string | null },
    { address: string }
  >({
    baseKey: "ResolvedName",
    ttl: 60 * 60,
    generateKeyFromParams({ address }): string {
      return address;
    },
    async computeIfAbsent({ address }) {
      const resolved = await resolver.resolve(address);
      if (!resolved) {
        return { resolvedName: null };
      }

      const forwardResolvedAddress = await resolveEnsOrNnsName(
        resolved,
        provider
      );

      if (address.toLowerCase() !== forwardResolvedAddress.toLowerCase()) {
        return { resolvedName: null };
      }

      return {
        resolvedName: resolved,
      };
    },
  });

  const blockTimestampCacheDefinition = makeDefinitionWithFixedTtl<
    { timestamp: string },
    { blockNumber: string }
  >({
    baseKey: "BlockNumber",
    generateKeyFromParams({ blockNumber }): string {
      return blockNumber;
    },
    async computeIfAbsent({ blockNumber }) {
      const block = await provider.getBlock(Number(blockNumber));
      return { timestamp: block.timestamp.toString() };
    },
    ttl: Infinity,
  });

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
        async resolve(_, { addressOrEnsName }) {
          return {
            address: (
              await resolveEnsOrNnsName(addressOrEnsName, provider)
            ).toLowerCase(),
          };
        },
      },

      async wrappedDelegates(
        _,
        { where, orderBy, first, after },
        context,
        info
      ) {
        const { statementStorage } = context;
        const selectionsForOrdering = (() => {
          switch (orderBy) {
            case WrappedDelegatesOrder.MostRecentlyActive:
              return parseSelection(
                `
                  {
                    __internalSortVotes: votes(first: 1, orderBy: blockNumber, orderDirection:desc) {
                      id
                      blockNumber
                    }
                  }
                `
              );

            case WrappedDelegatesOrder.LeastVotesCast:
            case WrappedDelegatesOrder.MostVotesCast:
              return parseSelection(
                `
                  {
                    __internalSortTotalVotes: votes(first: 1000) {
                      id
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

        const [remoteDelegates, delegateStatements] = await Promise.all([
          await fetchRemoteDelegates(context, queryDelegatesArgs, info, [
            ...selectionsForOrdering,
            ...selectionsForWhere,
          ]),
          statementStorage.listStatements(),
        ]);

        type NormalizedDelegate = {
          id: string;
          delegateStatementExists: boolean;
          delegatedDelegate: any | null;
        };

        const remoteDelegateSet = new Set(remoteDelegates.map(({ id }) => id));

        const delegates: NormalizedDelegate[] = [
          ...remoteDelegates.map((delegatedDelegate) => {
            const hasDelegateStatement = delegateStatements.includes(
              delegatedDelegate.id
            );

            return {
              id: delegatedDelegate.id,
              delegateStatementExists: hasDelegateStatement,
              delegatedDelegate,
            };
          }),
          ...delegateStatements.flatMap((address) => {
            if (remoteDelegateSet.has(address)) {
              return [];
            }

            return {
              id: address,
              delegateStatementExists: true,
              delegatedDelegate: null,
            };
          }),
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
                  ).isZero() && delegate.delegateStatementExists
                );
              });

            case WrappedDelegatesWhere.WithStatement: {
              return delegates.filter(
                (delegate) => delegate.delegateStatementExists
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
                descendingValueComparator((delegate) => {
                  if (!delegate.delegatedDelegate) {
                    return -Infinity;
                  }

                  return (
                    delegate.delegatedDelegate?.__internalSortVotes?.[0]
                      ?.blockNumber ?? -Infinity
                  );
                })
              );

            case WrappedDelegatesOrder.LeastVotesCast:
            case WrappedDelegatesOrder.MostVotesCast:
              return filteredDelegates.slice().sort(
                (orderBy === WrappedDelegatesOrder.LeastVotesCast
                  ? flipComparator
                  : (it) => it)(
                  descendingValueComparator((delegate: any) => {
                    if (!delegate.delegatedDelegate) {
                      return -Infinity;
                    }

                    return (
                      delegate.delegatedDelegate?.__internalSortTotalVotes
                        ?.length ?? -Infinity
                    );
                  })
                )
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
              delegateStatementExists: node.delegateStatementExists,
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
            startCursor: `${edges[0]?.cursor ?? ""}`,
            endCursor: `${edges[edges.length - 1]?.cursor ?? ""}`,
          },
        };
      },
    },

    OverallMetrics: {
      async totalSupply(_, _args, { cache }) {
        const cacheDefinition = makeSimpleCacheDefinition({
          baseKey: "OverallMetrics.totalSupply",
          ttl: 60 * 60,
          async computeIfAbsent() {
            return (await nounsToken.totalSupply()).toString();
          },
        });

        return await fetchWithCache(cache, cacheDefinition, undefined);
      },

      async proposalCount(_, _args, { cache }) {
        const cacheDefinition = makeSimpleCacheDefinition({
          baseKey: "OverallMetrics.proposalCount",
          ttl: 60 * 60,
          async computeIfAbsent() {
            return (await nounsDaoLogicV1.proposalCount()).toString();
          },
        });

        return await fetchWithCache(cache, cacheDefinition, undefined);
      },

      async quorumVotes(_, _args, { cache }) {
        const cacheDefinition = makeSimpleCacheDefinition({
          baseKey: "OverallMetrics.quorumVotes",
          ttl: 60 * 60,
          async computeIfAbsent() {
            return (await nounsDaoLogicV1.quorumVotes()).toString();
          },
        });

        return await fetchWithCache(cache, cacheDefinition, undefined);
      },

      async quorumVotesBPS(_, _args, { cache }) {
        const cacheDefinition = makeSimpleCacheDefinition({
          baseKey: "OverallMetrics.quorumVotesBPS",
          ttl: 60 * 60,
          async computeIfAbsent() {
            return (await nounsDaoLogicV1.quorumVotesBPS()).toString();
          },
        });

        return await fetchWithCache(cache, cacheDefinition, undefined);
      },

      async proposalThreshold(_, _args, { cache }) {
        const cacheDefinition = makeSimpleCacheDefinition({
          baseKey: "OverallMetrics.proposalThreshold",
          ttl: 60 * 60,
          async computeIfAbsent() {
            return (await nounsDaoLogicV1.proposalThreshold())
              .add(1)
              .toString();
          },
        });

        return await fetchWithCache(cache, cacheDefinition, undefined);
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
          delegateStatementExists: null,
        };
      },
    },

    ResolvedName: {
      async name({ address }, _args, { cache }) {
        return (await fetchWithCache(cache, resolvedNameCacheDef, { address }))
          .resolvedName;
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

      async statement(
        { address, delegateStatementExists },
        _args,
        { statementStorage }
      ) {
        if (delegateStatementExists === false) {
          return null;
        }

        const statement = await statementStorage.getStatement(address);
        if (!statement) {
          return null;
        }

        const values = formSchema.parse(JSON.parse(statement.signedPayload));
        return {
          address,
          values,
        };
      },

      address({ address }) {
        return { address };
      },
    },

    DelegateStatement: {
      summary({ values: { delegateStatement } }) {
        return extractFirstParagraph(
          marked.lexer(delegateStatement.slice(0, 1000))
        );
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
              args: { id: proposal.number },
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
              args: { id: proposal.number },
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
      async createNewDelegateStatement(
        parent,
        args,
        { statementStorage, emailStorage },
        info
      ) {
        const updatedAt = Date.now();
        const validated = validateSigned(args.data.statement);

        await statementStorage.addStatement({
          address: validated.address,
          signedPayload: validated.value,
          signature: validated.signature,
          updatedAt,
        });

        if (args.data.email) {
          await emailStorage.addEmail(validateSigned(args.data.email));
        }

        return {
          address: validated.address,
          delegateStatementExists: true,
        };
      },
    },
  };

  const resolvers = mergeResolvers<unknown, AgoraContextType>([
    typedResolvers,
    {
      Noun: {
        number: {
          selectionSet: `{ id }`,
          resolve({ id }) {
            return id;
          },
        },
      },

      Proposal: {
        title: {
          selectionSet: `{ description }`,
          resolve({ description }) {
            return getTitleFromProposalDescription(description);
          },
        },

        number: {
          selectionSet: `{ id }`,
          resolve({ id }) {
            return id;
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

        createdBlockGovernance: {
          selectionSet: `{ createdBlock }`,
          resolve(
            { createdBlock }: { createdBlock: string },
            args,
            context,
            info
          ) {
            return delegateToSchema({
              schema: nounsSchema,
              operation: OperationTypeNode.QUERY,
              fieldName: "governance",
              args: {
                id: "GOVERNANCE",
                block: { number: Number(createdBlock) },
              },
              context,
              info,
            });
          },
        },

        totalVotes: {
          selectionSet: `{ forVotes againstVotes abstainVotes }`,
          resolve({
            forVotes,
            againstVotes,
            abstainVotes,
          }: {
            forVotes: string;
            againstVotes: string;
            abstainVotes: string;
          }) {
            return BigNumber.from(forVotes)
              .add(againstVotes)
              .add(abstainVotes)
              .toString();
          },
        },
      },

      Vote: {
        createdAt: {
          selectionSet: `{ blockNumber }`,
          async resolve(
            { blockNumber }: { blockNumber: string },
            args,
            { cache }
          ) {
            return (
              await fetchWithCache(cache, blockTimestampCacheDefinition, {
                blockNumber,
              })
            ).timestamp;
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
            return {
              ...votes.reduce(
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
              ),
              totalVotes: votes.length,
            };
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

  return mapSchema(
    stitchSchemas({
      subschemas: [nounsSchema],

      typeDefs: schema,

      resolvers,
    }),
    {
      [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName, typeName) => {
        if (fieldName !== "id") {
          return fieldConfig;
        }

        return {
          ...fieldConfig,
          resolve: (...args) => {
            const resolvedValue = (fieldConfig.resolve ?? defaultFieldResolver)(
              ...args
            );

            return [typeName, resolvedValue].join("|");
          },
        };
      },
    }
  );
}
