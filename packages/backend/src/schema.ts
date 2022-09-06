import { stitchSchemas } from "@graphql-tools/stitch";
import { getTitleFromProposalDescription } from "./utils/markdown";
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
} from "graphql";
import { BigNumber, ethers } from "ethers";
import {
  NNSENSReverseResolver__factory,
  NounsDAOLogicV1__factory,
  NounsToken__factory,
} from "./contracts/generated";
import { Resolvers, WrappedDelegatesWhere } from "./generated/types";
import { validateForm } from "./formSchema";
import { WrappedDelegate } from "./model";
import schema from "./schemas/extensions.graphql";
import { fieldsMatching } from "./utils/graphql";

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

function makeDelegateResolveInfo(
  info: GraphQLResolveInfo,
  injectedFieldNames: string[] = []
): GraphQLResolveInfo {
  const fieldNames = ["id", ...injectedFieldNames];

  return {
    ...info,
    fieldName: "delegate",
    fieldNodes: [
      ...info.fieldNodes
        .flatMap((field) => {
          if (
            field.kind !== "Field" ||
            field.name.value !== "wrappedDelegates"
          ) {
            return [];
          }

          return field.selectionSet;
        })
        .flatMap((selectionNode) =>
          fieldsMatching(selectionNode, "delegate", info.fragments)
        )
        .map((field): FieldNode => {
          return {
            ...field,
            selectionSet: {
              ...field.selectionSet,
              selections: [
                ...field.selectionSet.selections,
                ...fieldNames.map((fieldName) => ({
                  kind: Kind.FIELD,
                  name: {
                    kind: Kind.NAME,
                    value: fieldName,
                  },
                })),
              ],
            },
          };
        }),
    ],
    returnType: (
      info.returnType as GraphQLNonNull<
        GraphQLList<GraphQLNonNull<GraphQLObjectType>>
      >
    ).ofType.ofType.ofType.getFields()["delegate"].type,
    parentType: (
      info.parentType.getFields()["wrappedDelegates"].type as GraphQLNonNull<
        GraphQLList<GraphQLNonNull<GraphQLObjectType>>
      >
    ).ofType.ofType.ofType,
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
    info: GraphQLResolveInfo,
    injectedFieldNames: string[] = []
  ) {
    const remoteDelegates = await delegateToSchema({
      schema: nounsSchema,
      operation: OperationTypeNode.QUERY,
      fieldName: "delegates",
      args: {
        first: 1000,
        orderBy: "delegatedVotesRaw",
        orderDirection: "desc",
      },
      context,
      info: makeDelegateResolveInfo(info, injectedFieldNames),
    });

    return remoteDelegates.map(
      (delegate): WrappedDelegate => ({
        address: delegate.id,
        underlyingDelegate: delegate,
      })
    );
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

      async wrappedDelegates(_, { where, orderBy }, context, info) {
        switch (where) {
          case WrappedDelegatesWhere.WithStatement: {
            const remoteDelegates = await fetchRemoteDelegates(context, info);

            return remoteDelegates.filter((delegate) =>
              delegateStatements.has(delegate.address)
            );
          }

          case WrappedDelegatesWhere.SeekingDelegation: {
            const remoteDelegates = await fetchRemoteDelegates(context, info, [
              "tokenHoldersRepresentedAmount",
            ]);

            const remoteDelegatesByAddress = new Map<string, any>(
              remoteDelegates.map((delegate) => [
                delegate.address,
                delegate.underlyingDelegate,
              ])
            );

            return Array.from(delegateStatements.keys()).flatMap((address) => {
              const remoteDelegate = remoteDelegatesByAddress.get(address);
              if (!remoteDelegate) {
                return [{ address }];
              }

              if (!remoteDelegate.tokenHoldersRepresentedAmount) {
                return [{ address, underlyingDelegate: remoteDelegate }];
              }

              return [];
            });
          }

          default: {
            const remoteDelegates = await fetchRemoteDelegates(context, info);
            const remoteDelegatesSet = new Set(
              remoteDelegates.map((delegate) => delegate.address)
            );

            return [
              // todo: pagination
              ...remoteDelegates.slice(0, 50),
              ...Array.from(delegateStatements.keys())
                .filter((address) => !remoteDelegatesSet.has(address))
                .map((address) => ({ address })),
            ];
          }
        }
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
