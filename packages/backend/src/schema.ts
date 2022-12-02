import { stitchSchemas } from "@graphql-tools/stitch";
import { MapperKind, mapSchema, parseSelectionSet } from "@graphql-tools/utils";
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
  GraphQLSchema,
  Kind,
  OperationTypeNode,
  responsePathAsArray,
  SelectionNode,
} from "graphql";
import { BigNumber, ethers } from "ethers";
import {
  Delegate_OrderBy,
  OrderDirection,
  QueryDelegatesArgs,
  Resolvers,
  WrappedDelegatesOrder,
  WrappedDelegatesWhere,
} from "./generated/types";
import { formSchema } from "./formSchema";
import { AgoraContextType, TracingContext, WrappedDelegate } from "./model";
import schema from "./schemas/extensions.graphql";
import { fieldsMatching } from "./utils/graphql";
import { descendingValueComparator, flipComparator } from "./utils/sorting";
import { marked } from "marked";
import { validateSigned } from "./utils/signing";
import { Span } from "@cloudflare/workers-honeycomb-logger";
import { fetchVotes, groupVotesByAuction } from "./propHouse";
import {
  resolveEnsOrNnsName,
  resolveNameFromAddress,
} from "./utils/resolveName";
import { NNSENSReverseResolver__factory } from "./contracts/generated";

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

      currentGovernance: {
        async resolve(_parent, _args, context, info) {
          return delegateToSchema({
            schema: nounsSchema,
            operation: OperationTypeNode.QUERY,
            fieldName: "governance",
            args: { id: "GOVERNANCE" },
            context,
            info,
          });
        },
      },

      address: {
        async resolve(_, { addressOrEnsName }, { snapshot }) {
          if (ethers.utils.isAddress(addressOrEnsName)) {
            const address = addressOrEnsName.toLowerCase();
            return { address };
          }

          const foundMapping = Array.from(
            snapshot.NounsToken.addressToEnsName.entries()
          ).find(([, ensName]) => ensName === addressOrEnsName);
          if (foundMapping) {
            const [address] = foundMapping;
            return { address };
          } else {
            const address = await resolveEnsOrNnsName(
              addressOrEnsName,
              provider
            );
            return { address };
          }
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

            case WrappedDelegatesOrder.MostRelevant:
              const { hasStatements, withoutStatements } =
                filteredDelegates.reduce(
                  (acc, value) => {
                    if (value.delegateStatementExists) {
                      return {
                        ...acc,
                        hasStatements: [...acc.hasStatements, value],
                      };
                    } else {
                      return {
                        ...acc,
                        withoutStatements: [...acc.withoutStatements, value],
                      };
                    }
                  },
                  { hasStatements: [], withoutStatements: [] }
                );

              return [...hasStatements, ...withoutStatements];

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
      quorumVotesBPS(_, _args, { snapshot }) {
        return snapshot.NounsDAOLogicV1.quorumBps.toString();
      },

      proposalThresholdBPS(_, _args, { snapshot }) {
        return snapshot.NounsDAOLogicV1.proposalBps.toString();
      },
    },

    Address: {
      isContract: {
        async resolve({ address }) {
          const code = await provider.getCode(address);
          const parsedCode = ethers.utils.arrayify(code);
          return !!parsedCode.length;
        },
      },

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
      async name({ address }, _args, { snapshot }) {
        const fromSnapshot = snapshot.NounsToken.addressToEnsName.get(
          address.toLowerCase()
        );
        if (typeof fromSnapshot !== "undefined") {
          return fromSnapshot;
        }

        return await resolveNameFromAddress(address, resolver, provider);
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
        const validated = await validateSigned(provider, args.data.statement);

        await statementStorage.addStatement({
          address: validated.address,
          signedPayload: validated.value,
          signature: validated.signature,
          signatureType: validated.signatureType,
          updatedAt,
        });

        if (args.data.email) {
          await emailStorage.addEmail(
            await validateSigned(provider, args.data.email)
          );
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

        voteStartsAt: {
          selectionSet: `{ startBlock }`,
          async resolve({ startBlock }: { startBlock: string }) {
            const latestBlock = await provider.getBlock("latest");
            return (
              latestBlock.timestamp +
              12 * (parseInt(startBlock) - latestBlock.number)
            ).toString();
          },
        },

        voteEndsAt: {
          selectionSet: `{ endBlock }`,
          async resolve({ endBlock }: { endBlock: string }) {
            // todo: resolve this from snapshot somehow?
            const latestBlock = await provider.getBlock("latest");
            return (
              latestBlock.timestamp +
              12 * (parseInt(endBlock) - latestBlock.number)
            ).toString();
          },
        },

        actualStatus: {
          selectionSet: `{ status, startBlock, endBlock, forVotes, againstVotes, quorumVotes }`,
          async resolve({
            status,
            startBlock,
            endBlock,
            forVotes,
            againstVotes,
            quorumVotes,
            executionETA,
          }: {
            status: string;
            startBlock: string;
            endBlock: string;
            forVotes: string;
            againstVotes: string;
            quorumVotes: string;
            executionETA: number;
          }) {
            const latestBlock = await provider.getBlock("latest");
            // Have to further refine status based on proposal fields
            if (status == "PENDING") {
              if (latestBlock.number >= parseInt(startBlock)) {
                return "ACTIVE";
              } else {
                return "PENDING";
              }
            } else if (status == "ACTIVE") {
              if (latestBlock.number > parseInt(endBlock)) {
                const forVoteCount = parseInt(forVotes);
                if (
                  forVoteCount <= parseInt(againstVotes) ||
                  forVoteCount < parseInt(quorumVotes)
                ) {
                  return "DEFEATED";
                }

                if (!executionETA) {
                  return "EXECUTED";
                }
              }

              return "ACTIVE";
            } else if (status === "QUEUED") {
              const GRACE_PERIOD = 14 * 60 * 60 * 24;
              if (latestBlock.timestamp >= executionETA + GRACE_PERIOD) {
                return "EXPIRED";
              }

              return "QUEUED";
            } else {
              return status;
            }
          },
        },
      },

      Vote: {
        createdAt: {
          selectionSet: `{ blockNumber }`,
          async resolve(
            { blockNumber }: { blockNumber: string },
            args,
            { snapshot }
          ) {
            return snapshot.NounsDAOLogicV1.voteBlockTimestamp.get(
              Number(blockNumber)
            );
          },
        },
      },

      Delegate: {
        address: {
          selectionSet: `{ id }`,
          resolve({ id }) {
            return { address: id };
          },
        },

        resolvedName: {
          selectionSet: `{ id }`,
          resolve({ id }) {
            return { address: id };
          },
        },

        propHouseVotes: {
          selectionSet: `{ id }`,
          async resolve(
            { id },
            args,
            {
              snapshot: {
                PropHouse: { auctions },
              },
            }
          ) {
            const address = ethers.utils.getAddress(id);

            const votes = await fetchVotes({ voter: address });
            const groupedVotes = groupVotesByAuction(votes, auctions);

            return groupedVotes.map((vote) => {
              return {
                id: `PropHouseRoundVotes|${address}|${vote.auction.id}`,
                createdAt: vote.createdAt,
                round: vote.auction,
                votes: vote.votes.map((vote) => ({
                  proposal: {
                    id: `PropHouseProposal|${vote.proposal.id}`,
                    number: vote.proposal.id,
                    ...vote.proposal,
                  },
                  weight: vote.weight,
                })),
              };
            });
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

  return attachTracingContextInjection(
    mapSchema(
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

          if (typeName === "Governance" && fieldName === "id") {
            return null;
          }

          return {
            ...fieldConfig,
            resolve: (...args) => {
              const resolvedValue = (
                fieldConfig.resolve ?? defaultFieldResolver
              )(...args);

              return [typeName, resolvedValue].join("|");
            },
          };
        },
      }
    )
  );
}

function attachTracingContextInjection(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD](fieldConfig) {
      // Only apply to user-implemented resolvers. Default resolvers will
      // probably not have interesting information.
      if (
        !fieldConfig.resolve ||
        fieldConfig.resolve === defaultFieldResolver
      ) {
        return fieldConfig;
      }

      return {
        ...fieldConfig,
        async resolve(...resolverArgs) {
          const [parentValue, args, context, info] = resolverArgs;

          const tracingContext: TracingContext = context.tracingContext;
          function getFirstMatchingParentSpan(
            path: ReadonlyArray<string | number>
          ): Span {
            if (!path.length) {
              return tracingContext.rootSpan as any;
            }

            const parentSpan = tracingContext.spanMap.get(path.join(" > "));
            if (parentSpan) {
              return parentSpan as any;
            }

            return getFirstMatchingParentSpan(path.slice(0, -1));
          }

          const path = responsePathAsArray(info.path);
          const parentSpan = getFirstMatchingParentSpan(path.slice(0, -1));

          const span = parentSpan.startChildSpan(
            `${info.parentType.name}.${info.fieldName}`
          );

          span.addData({
            graphql: {
              path,
              args,
            },
          });

          tracingContext.spanMap.set(path.join(" > "), span);

          const nextContext: AgoraContextType = {
            ...context,
            cache: { ...context.cache, span },
          };
          const response = await fieldConfig.resolve(
            parentValue,
            args,
            nextContext,
            info
          );

          span.finish();

          return response;
        },
      };
    },
  });
}
