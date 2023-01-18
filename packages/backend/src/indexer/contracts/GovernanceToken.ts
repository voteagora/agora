import { efficientLengthEncodingNaturalPositiveNumbers } from "../utils/efficientLengthEncoding";
import { StorageHandle } from "../storageHandle";
import { IndexerDefinition } from "../process";
import { GovernanceTokenInterface } from "../../contracts/generated/GovernanceToken";
import { makeContractInstance } from "../../contracts";
import { GovernanceToken__factory } from "../../contracts/generated";
import { ethers } from "ethers";

const governanceTokenContract = makeContractInstance({
  iface: GovernanceToken__factory.createInterface(),
  address: "0x4200000000000000000000000000000000000042",
  startingBlock: 6490467,
});

type Entities = {
  Aggregates: {
    totalSupply: string;
    delegatedSupply: string;
  };
  Address: {
    address: string;
    tokensOwned: string;
    tokensRepresented: string;
    delegatingTo: string;
    accountsRepresented: string[];
  };
};

export const governanceTokenIndexer: IndexerDefinition<
  GovernanceTokenInterface,
  Entities
> = {
  name: "GovernanceToken",
  ...governanceTokenContract,
  indexes: {
    Address: [
      {
        indexName: "byTokenOwned",
        indexKey(entity) {
          const tokenOwnedAmount = ethers.BigNumber.from(entity.tokensOwned);
          return efficientLengthEncodingNaturalPositiveNumbers(
            tokenOwnedAmount
          );
        },
      },
      {
        indexName: "byTokensRepresented",
        indexKey(entity) {
          const tokensRepresented = ethers.BigNumber.from(
            entity.tokensRepresented
          );

          return efficientLengthEncodingNaturalPositiveNumbers(
            tokensRepresented
          );
        },
      },
      {
        indexName: "byTokenHoldersRepresented",
        indexKey(entity) {
          return efficientLengthEncodingNaturalPositiveNumbers(
            ethers.BigNumber.from(entity.accountsRepresented.length)
          );
        },
      },
    ],
  },
  eventHandlers: [
    {
      signature: "Transfer(address,address,uint256)",
      async handle(handle, event) {
        const { from, to, value } = event.args;
        if (from === to) {
          return;
        }

        const aggregate = await loadAggregate(handle);
        if (to === ethers.constants.AddressZero) {
          aggregate.totalSupply = aggregate.totalSupply.sub(value);
        }

        if (from === ethers.constants.AddressZero) {
          aggregate.totalSupply = aggregate.totalSupply.add(value);
        }

        const [fromEntity, toEntity] = await Promise.all([
          loadAccount(handle, from),
          loadAccount(handle, to),
        ]);

        fromEntity.tokensOwned = fromEntity.tokensOwned.sub(value);
        toEntity.tokensOwned = toEntity.tokensOwned.add(value);

        saveAccount(handle, fromEntity);
        saveAccount(handle, toEntity);
        saveAggregate(handle, aggregate);
      },
    },
    {
      signature: "DelegateVotesChanged(address,uint256,uint256)",
      async handle(handle, event) {
        const account = await loadAccount(handle, event.args.delegate);

        if (!account.tokensRepresented.eq(event.args.previousBalance)) {
          throw new Error(
            `token balance incorrect. got ${account.tokensRepresented.toString()}, expected: ${event.args.previousBalance.toString()}`
          );
        }

        account.tokensRepresented = event.args.newBalance;

        const agg = await loadAggregate(handle);

        const change = event.args.newBalance.sub(event.args.previousBalance);
        agg.delegatedSupply = agg.delegatedSupply.add(change);

        saveAggregate(handle, agg);
        saveAccount(handle, account);
      },
    },
    {
      signature: "DelegateChanged(address,address,address)",
      async handle(handle, event) {
        if (event.args.fromDelegate === event.args.toDelegate) {
          return;
        }

        const delegatorAccount = await loadAccount(
          handle,
          event.args.delegator
        );

        if (delegatorAccount.delegatingTo !== event.args.fromDelegate) {
          throw new Error("mismatched from address");
        }

        delegatorAccount.delegatingTo = event.args.toDelegate;

        if (event.args.fromDelegate !== ethers.constants.AddressZero) {
          const fromAccount = await loadAccount(
            handle,
            event.args.fromDelegate
          );
          const delegatorIndex = fromAccount.accountsRepresented.indexOf(
            event.args.delegator
          );
          if (delegatorIndex === -1) {
            throw new Error("delegator not found in from account");
          }

          fromAccount.accountsRepresented.splice(delegatorIndex, 1);
          saveAccount(handle, fromAccount);
        }

        if (event.args.toDelegate !== ethers.constants.AddressZero) {
          const toAccount = await loadAccount(handle, event.args.toDelegate);

          toAccount.accountsRepresented = [
            ...toAccount.accountsRepresented,
            event.args.delegator,
          ];

          saveAccount(handle, toAccount);
        }

        saveAccount(handle, delegatorAccount);
      },
    },
  ],
};

// todo: some nice save load abstraction would help here

type Account = {
  address: string;
  tokensOwned: ethers.BigNumber;
  tokensRepresented: ethers.BigNumber;
  accountsRepresented: string[];
  delegatingTo: string;
};

async function loadAccount(
  handle: StorageHandle<Entities>,
  from: string
): Promise<Account> {
  const value = (await handle.loadEntity("Address", from)) ?? {
    address: from,
    tokensOwned: "0",
    tokensRepresented: "0",
    accountsRepresented: [from],
    delegatingTo: ethers.constants.AddressZero,
  };

  return {
    address: value.address,
    tokensOwned: ethers.BigNumber.from(value.tokensOwned),
    tokensRepresented: ethers.BigNumber.from(value.tokensRepresented),
    accountsRepresented: value.accountsRepresented,
    delegatingTo: value.delegatingTo,
  };
}

function saveAccount(handle: StorageHandle<Entities>, entity: Account) {
  return handle.saveEntity("Address", entity.address, {
    address: entity.address,
    tokensOwned: entity.tokensOwned.toString(),
    tokensRepresented: entity.tokensRepresented.toString(),
    accountsRepresented: entity.accountsRepresented,
    delegatingTo: entity.delegatingTo,
  });
}

const aggregateCumulativeId = "CUMULATIVE";

async function loadAggregate(handle: StorageHandle<Entities>) {
  const cumulativeAggregate = await handle.loadEntity(
    "Aggregates",
    aggregateCumulativeId
  );

  return {
    delegatedSupply: ethers.BigNumber.from(
      cumulativeAggregate?.delegatedSupply ?? "0"
    ),
    totalSupply: ethers.BigNumber.from(cumulativeAggregate?.totalSupply ?? "0"),
  };
}

function saveAggregate(
  handle: StorageHandle<Entities>,
  entity: Awaited<ReturnType<typeof loadAggregate>>
) {
  return handle.saveEntity("Aggregates", aggregateCumulativeId, {
    delegatedSupply: entity.delegatedSupply.toString(),
    totalSupply: entity.totalSupply.toString(),
  });
}
