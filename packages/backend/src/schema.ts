import { makeExecutableSchema } from "@graphql-tools/schema";
import { MapperKind, mapSchema } from "@graphql-tools/utils";
import {
  extractFirstParagraph,
  getTitleFromProposalDescription,
} from "./utils/markdown";
import { mergeResolvers } from "@graphql-tools/merge";
import {
  defaultFieldResolver,
  GraphQLSchema,
  responsePathAsArray,
} from "graphql";
import { BigNumber, ethers } from "ethers";
import {
  Resolvers,
  WrappedDelegatesOrder,
  WrappedDelegatesWhere,
} from "./generated/types";
import { formSchema } from "./formSchema";
import { AgoraContextType, TracingContext } from "./model";
import schema from "./schema.graphql";
import { marked } from "marked";
import { validateSigned } from "./utils/signing";
import { Span } from "@cloudflare/workers-honeycomb-logger";

export function makeGatewaySchema() {
  const provider = new ethers.providers.CloudflareProvider();

  const typedResolvers: Resolvers = {
    Query: {
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
        const { statementStorage, snapshot } = context;

        const delegateStatements = await statementStorage.listStatements();

        const remoteDelegates = Array.from(
          snapshot.ENSToken.accounts.entries()
        ).map(([address, value]) => ({
          address,
          ...value,
        }));

        type NormalizedDelegate = {
          id: string;
          delegateStatementExists: boolean;
          delegatedDelegate: any | null;
        };

        const remoteDelegateSet = new Set(
          remoteDelegates.map(({ address }) => address.toLowerCase())
        );

        const delegates: NormalizedDelegate[] = [
          ...remoteDelegates.map((delegatedDelegate) => {
            const id = delegatedDelegate.address.toLowerCase();
            const hasDelegateStatement = delegateStatements.includes(id);

            return {
              id,
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
            case WrappedDelegatesOrder.MostRelevant:
              const { hasStatements, withoutStatements } =
                filteredDelegates.reduce(
                  (acc, value) => {
                    if (value.delegateStatementExists) {
                      acc.hasStatements.push(value);
                    } else {
                      acc.withoutStatements.push(value);
                    }

                    return acc;
                  },
                  { hasStatements: [], withoutStatements: [] }
                );

              return [...hasStatements, ...withoutStatements];

            case WrappedDelegatesOrder.MostVotingPower:
              return filteredDelegates.reverse();

            default:
              throw new Error("unknown");
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

      delegate({ underlyingDelegate, address }, args, { snapshot }, info) {
        if (underlyingDelegate) {
          return underlyingDelegate;
        }

        const account = snapshot.ENSToken.accounts.get(address);
        return account;
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
        // todo: implement
        return [];
      },

      async mostValuableProposals(
        { values: { mostValuableProposals } },
        args,
        context,
        info
      ) {
        // todo: implement
        return [];
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
      Proposal: {
        title: {
          selectionSet: `{ description }`,
          resolve({ description }) {
            return getTitleFromProposalDescription(description);
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
    },
  ]);

  return attachTracingContextInjection(
    mapSchema(
      makeExecutableSchema({
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
