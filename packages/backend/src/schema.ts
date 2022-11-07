import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  extractFirstParagraph,
  getTitleFromProposalDescription,
  trimENSStatementHeader,
} from "./utils/markdown";
import { GraphQLScalarType } from "graphql";
import { BigNumber, ethers } from "ethers";
import { QueryWrappedDelegatesArgs, Resolvers } from "./generated/types";
import { formSchema } from "./formSchema";
import { Account, StoredStatement } from "./model";
import schema from "./schema.graphql";
import { marked } from "marked";
import { validateSigned } from "./utils/signing";
import { resolveEnsName, resolveNameFromAddress } from "./utils/resolveName";
import { Snapshot } from "./snapshot";
import { attachTracingContextInjection } from "./graphql/tracingContext";
import { applyIdPrefix } from "./graphql/applyIdPrefix";

// todo: fix everything in here
// todo: __typename
// todo: overviewmetricscontainer
// todo: decompose this file

export function makeGatewaySchema() {
  const amountSpec = {
    currency: "ENS",
    decimals: 18,
  };

  function getTotalSupply(snapshot: Snapshot) {
    return snapshot.ENSToken.totalSupply;
  }

  function getQuorum(snapshot: Snapshot) {
    const totalSupply = getTotalSupply(snapshot);

    return totalSupply.mul(snapshot.ENSGovernor.quorumNumerator).div(10000);
  }

  function bpsOf(top: BigNumber, bottom: BigNumber) {
    return Math.round(
      top
        .mul(100 * 100)
        .div(bottom)
        .toNumber()
    );
  }

  function getAccount(address: string, snapshot: Snapshot): Account {
    const account = snapshot.ENSToken.accounts.get(address.toLowerCase());
    if (!account) {
      return null;
    }

    return {
      ...account,
      address,
    };
  }

  function proposedByAddress(address: string, snapshot: Snapshot) {
    return Array.from(snapshot.ENSGovernor.proposals.values()).filter(
      (prop) => prop.proposer === address
    );
  }

  function votesByAddress(address: string, snapshot: Snapshot) {
    return snapshot.ENSGovernor.votes.filter(
      (vote) => vote.voter.toLowerCase() === address
    );
  }

  function getVotesForProposal(proposalId: BigNumber, snapshot: Snapshot) {
    return snapshot.ENSGovernor.votes.filter((vote) =>
      vote.proposalId.eq(proposalId)
    );
  }

  function recentCompletedProposals(snapshot: Snapshot) {
    return Array.from(snapshot.ENSGovernor.proposals.values())
      .filter((it) => ["EXECUTED", "QUEUED"].includes(it.status.type))
      .sort(bigNumberDescendingComparator((it) => it.startBlock));
  }

  const typedResolvers: Resolvers = {
    BigInt: new GraphQLScalarType({
      name: "BigInt",
      serialize(value: ethers.BigNumber) {
        return value.toString();
      },
      parseValue(value) {
        return ethers.BigNumber.from(value);
      },
    }),
    Timestamp: new GraphQLScalarType({
      name: "Timestamp",
      serialize(value: Date) {
        return +value;
      },
      parseValue(value: number) {
        new Date(value);
      },
    }),
    Query: {
      address: {
        async resolve(_, { addressOrEnsName }, { provider }) {
          if (ethers.utils.isAddress(addressOrEnsName)) {
            const address = addressOrEnsName.toLowerCase();
            return { address };
          }

          const address = await resolveEnsName(addressOrEnsName, provider);
          return {
            // todo: thread through the ens name here too
            address: address.toLowerCase(),
          };
        },
      },

      async wrappedDelegates(
        _,
        { where, orderBy, first, after }: QueryWrappedDelegatesArgs,
        { delegateStorage }
      ) {
        return await delegateStorage.getDelegates({
          first,
          after,
          orderBy,
          where,
        });
      },

      proposals(_parent, _args, { snapshot }) {
        return Array.from(snapshot.ENSGovernor.proposals.values());
      },

      metrics() {
        return {};
      },
    },

    Metrics: {
      proposalThreshold() {
        return ethers.BigNumber.from("100000000000000000000000");
      },
      averageVoterTurnOutBps() {
        // todo: implement
        return 1500;
      },
      delegatedSupply(_parent, _args, { snapshot }) {
        const delegatedSupply = snapshot.ENSToken.delegatedSupply;

        return {
          amount: delegatedSupply,
          ...amountSpec,
        };
      },
      totalSupply(_parent, _args, { snapshot }) {
        return {
          amount: getTotalSupply(snapshot),
          ...amountSpec,
        };
      },
      quorum(_parent, _args, { snapshot }) {
        return getQuorum(snapshot);
      },
    },

    Address: {
      isContract: {
        async resolve({ address }, _args, { provider }) {
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
        // todo: detail type here
        return {
          address,
          delegateStatementExists: null,
        };
      },

      account({ address }, _args, { snapshot }) {
        return getAccount(address, snapshot);
      },
    },

    ResolvedName: {
      async name({ address }, _args, { provider }) {
        return await resolveNameFromAddress(address, provider);
      },

      address({ address }) {
        return address;
      },
    },

    Account: {
      id({ address }) {
        return `Account|${address}`;
      },
      address({ address }) {
        return {
          address,
        };
      },

      amountOwned({ balance }) {
        return balance;
      },

      delegatingTo({ delegatingTo }, _args, { snapshot }) {
        return getAccount(delegatingTo, snapshot);
      },
    },

    Delegate: {
      id({ address }) {
        return `Delegate|${address}`;
      },

      address({ address }) {
        return {
          address,
        };
      },

      delegateMetrics(
        { address, tokenHoldersRepresented },
        _args,
        { snapshot }
      ) {
        const votes = votesByAddress(address, snapshot);
        const lastTenProps = new Set(
          recentCompletedProposals(snapshot)
            .slice(0, 10)
            .map((it) => it.id.toString())
        );

        // todo: implement
        return {
          tokenHoldersRepresentedCount: tokenHoldersRepresented,
          totalVotes: votes.length,
          forVotes: votes.filter((vote) => vote.support === 1).length,
          againstVotes: votes.filter((vote) => vote.support === 0).length,
          abstainVotes: votes.filter((vote) => vote.support === 2).length,
          ofLastTenProps: votes.filter((vote) =>
            lastTenProps.has(vote.proposalId.toString())
          ).length,
          ofTotalProps: Math.floor(
            (votes.length / snapshot.ENSGovernor.proposals.size) * 100
          ),
          proposalsCreated: proposedByAddress(address, snapshot).length,
        };
      },

      proposed({ address }, _args, { snapshot }) {
        return proposedByAddress(address, snapshot);
      },

      votes({ address }, _args, { snapshot }) {
        return votesByAddress(address, snapshot);
      },

      snapshotVotes({ address }, _args, { snapshotVotes }) {
        return snapshotVotes.votes.filter(
          (vote) => vote.voter.toLowerCase() === address
        );
      },

      tokensRepresented({ tokensRepresented }) {
        return tokensRepresented;
      },
    },

    SnapshotVote: {
      id({ id }) {
        return id;
      },
      createdAt({ created }) {
        return new Date(created * 1000);
      },
      proposal({ proposal: { id } }, _args, { snapshotVotes }) {
        return snapshotVotes.proposals.find((prop) => prop.id === id);
      },
      reason({ reason }) {
        return reason;
      },
      selectedChoiceIdx({ choice }) {
        return Array.isArray(choice) ? choice[0] : choice;
      },
    },

    SnapshotProposal: {
      id({ id }) {
        return id;
      },
      title({ title }) {
        return title;
      },
      link({ link }) {
        return link;
      },
      choices({ choices, scores }) {
        return choices.map((choice, idx) => ({
          title: choice,
          score: scores[idx],
        }));
      },
    },

    Vote: {
      id({ transactionHash }) {
        return `Vote|${transactionHash}`;
      },

      proposal({ proposalId }, _args, { snapshot }) {
        return snapshot.ENSGovernor.proposals.get(proposalId.toString());
      },

      reason({ reason }) {
        return reason;
      },

      supportDetailed({ support }) {
        return support;
      },

      transaction({ blockHash, transactionHash }) {
        return { blockHash, transactionHash };
      },

      votes({ weight }) {
        return weight;
      },

      voter({ voter }, _args, { snapshot }) {
        return getAccount(voter, snapshot);
      },
    },

    Proposal: {
      id({ id }) {
        return `Proposal|${id.toString()}`;
      },

      number({ id }) {
        return id;
      },

      proposer({ proposer }, _args, { snapshot }) {
        return getAccount(proposer, snapshot);
      },

      votes({ id }, _args, { snapshot }) {
        return getVotesForProposal(id, snapshot);
      },

      totalValue({ values }) {
        return values.reduce((acc, value) => acc.add(value), BigNumber.from(0));
      },

      title({ description }) {
        return getTitleFromProposalDescription(description);
      },

      totalVotes({ id }, _args, { snapshot }) {
        const votes = getVotesForProposal(id, snapshot);
        return votes.reduce(
          (acc, vote) => acc.add(vote.weight),
          BigNumber.from(0)
        );
      },
    },

    Transaction: {
      id({ transactionHash }) {
        return `Transaction:${transactionHash}`;
      },

      hash({ transactionHash }) {
        return transactionHash;
      },

      async block({ blockHash }, _args, { provider }) {
        return await provider.getBlock(blockHash);
      },
    },

    Block: {
      id({ hash }) {
        return `Block:${hash}`;
      },

      number({ number }) {
        return BigNumber.from(number);
      },

      timestamp({ timestamp }) {
        return new Date(timestamp * 1000);
      },
    },

    // todo: some of this stuff is in state
    VotingPower: {
      amount(value) {
        return {
          amount: value,
          ...amountSpec,
        };
      },

      bpsOfTotal(value, _args, { snapshot }) {
        const totalSupply = getTotalSupply(snapshot);
        return bpsOf(value, totalSupply);
      },

      bpsOfQuorum(value, _args, { snapshot }) {
        const quorum = getQuorum(snapshot);
        return bpsOf(value, quorum);
      },
    },

    WrappedDelegate: {
      id({ address }) {
        return address;
      },

      address({ address }) {
        return {
          address,
        };
      },

      delegate(delegate) {
        return delegate;
      },

      async statement({ address, statement }, _args) {
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
          marked.lexer(trimENSStatementHeader(delegateStatement.slice(0, 1000)))
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
        { statementStorage, emailStorage, provider },
        info
      ) {
        const updatedAt = Date.now();
        const validated = await validateSigned(provider, args.data.statement);

        const nextStatement: StoredStatement = {
          address: validated.address,
          signedPayload: validated.value,
          signature: validated.signature,
          signatureType: validated.signatureType,
          updatedAt,
        };

        await statementStorage.addStatement(nextStatement);

        if (args.data.email) {
          await emailStorage.addEmail(
            await validateSigned(provider, args.data.email)
          );
        }

        // todo: fix return type

        return {
          address: validated.address,
          statement: nextStatement,
        };
      },
    },
  };

  const resolvers = typedResolvers;

  return attachTracingContextInjection(
    applyIdPrefix(
      makeExecutableSchema({
        typeDefs: schema,

        resolvers,
      })
    )
  );
}

function bigNumberDescendingComparator<T>(fn: (item: T) => BigNumber) {
  return (a: T, b: T) => (fn(b).lt(fn(a)) ? -1 : 1);
}
