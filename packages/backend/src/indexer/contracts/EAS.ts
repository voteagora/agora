import { ethers, BigNumber } from "ethers";
import { makeContractInstance } from "../../contracts";
import { EAS__factory } from "../../contracts/generated";
import {
  StorageHandleForIndexer,
  makeEntityDefinition,
  makeIndexerDefinition,
} from "../process";
import * as serde from "../serde";
import { RuntimeType } from "../serde";
import {
  efficientLengthEncodingNaturalPositiveNumbers,
  efficientLengthEncodingStringAsc,
  efficientLengthEncodingStringDesc,
} from "../utils/efficientLengthEncoding";
import {
  governanceTokenIndexer,
  loadAccount,
  saveAccount,
} from "./GovernanceToken";
import {
  attestationAggregatesEntityDefinitions,
  updateApplicationsAggregate,
  updateApplicationsAggregateForRemoval,
  updateListsAggregate,
  updateListsAggregateForRemoval,
} from "./utils/aggregates";
import {
  addToApplicationsTrie,
  addToListsTrie,
  serchEntityDefinitions,
} from "./utils/search";

const EASContract = makeContractInstance({
  iface: EAS__factory.createInterface(),
  address: "0x4200000000000000000000000000000000000021",
  startingBlock: 107953260,
});

const rpgfSchemas: { [key: string]: string } = {
  "0xfdcfdad2dbe7489e0ce56b260348b7f14e8365a8a325aef9834818c00d46b31b":
    "BADGEHOLDERS",
  "0x76e98cce95f3ba992c2ee25cef25f756495147608a3da3aa2e5ca43109fe77cc":
    "APPLICATION",
  "0x3e3e2172aebb902cf7aa6e1820809c5b469af139e7a4265442b1c22b97c6b2a5": "LISTS",
  "0xac4c92fc5c7babed88f78a917cdbcdc1c496a8f4ab2d5b2ec29402736b2cf929":
    "PROFILE",
  "0xebbf697d5d3ca4b53579917ffc3597fb8d1a85b8c6ca10ec10039709903b9277":
    "APPLICATION_APPROVAL",
};

const badgeholderAttester = "0x621477dBA416E12df7FF0d48E14c4D20DC85D7D9";

const CUTOFF_BLOCK = 111264212;
const LISTS_START_BLOCK = 111837305;

export const EASIndexer = makeIndexerDefinition(EASContract, {
  name: "EAS",

  entities: {
    ...serchEntityDefinitions,
    ...attestationAggregatesEntityDefinitions,
    ...governanceTokenIndexer.entities,

    Participant: makeEntityDefinition({
      serde: serde.object({
        recipient: serde.string,
        application: serde.nullable(serde.string),
        profile: serde.nullable(serde.string),
        approvedApplication: serde.nullable(serde.string),
      }),
      indexes: [],
    }),

    Badgeholder: makeEntityDefinition({
      serde: serde.object({
        uid: serde.string,
        recipient: serde.string,
        attester: serde.string,
        schema: serde.string,
        revokedAtBlock: serde.nullable(serde.bigNumber),

        rpgfRound: serde.number,
        referredBy: serde.string,
        referredMethod: serde.string,

        blockNumber: serde.bigNumber,
      }),
      indexes: [
        {
          indexName: "byRecipient",
          indexKey({ recipient }) {
            return recipient;
          },
        },
        {
          // This index is used for shuffle
          indexName: "byBlockNumber",
          indexKey({ blockNumber }) {
            return efficientLengthEncodingNaturalPositiveNumbers(blockNumber);
          },
        },
      ],
    }),

    Application: makeEntityDefinition({
      serde: serde.object({
        uid: serde.string,
        recipient: serde.string,
        attester: serde.string,
        schema: serde.string,
        revokedAtBlock: serde.nullable(serde.bigNumber),

        displayName: serde.string,
        applicationMetadataPtrType: serde.number,
        applicationMetadataPtr: serde.string,
        applicantType: serde.string,
        websiteUrl: serde.string,
        bio: serde.string,
        contributionDescription: serde.string,
        contributionLinks: serde.array(
          serde.object({
            type: serde.string,
            url: serde.string,
            description: serde.string,
          })
        ),
        impactCategory: serde.array(serde.string),
        impactDescription: serde.string,
        impactMetrics: serde.array(
          serde.object({
            description: serde.string,
            number: serde.number,
            url: serde.string,
          })
        ),
        fundingSources: serde.array(
          serde.object({
            type: serde.string,
            currency: serde.string,
            amount: serde.number,
            description: serde.string,
          })
        ),
        payoutAddress: serde.string,
        understoodKYCRequirements: serde.boolean,
        understoodFundClaimPeriod: serde.boolean,
        certifiedNotDesignatedOrSanctionedOrBlocked: serde.boolean,
        certifiedNotSponsoredByPoliticalFigureOrGovernmentEntity: serde.boolean,
        certifiedNotBarredFromParticipating: serde.boolean,

        blockNumber: serde.bigNumber,

        superseded: serde.nullable(serde.string),
        supersededBy: serde.nullable(serde.string),

        lists: serde.array(serde.string),
      }),
      indexes: [
        {
          indexName: "byNameAZ",
          indexKey({ displayName }) {
            return efficientLengthEncodingStringDesc(displayName);
          },
        },
        {
          indexName: "byNameZA",
          indexKey({ displayName }) {
            return efficientLengthEncodingStringAsc(displayName);
          },
        },
        {
          // This index is used to be used for shuffle
          indexName: "byBlockNumber",
          indexKey({ blockNumber }) {
            return efficientLengthEncodingNaturalPositiveNumbers(blockNumber);
          },
        },
        {
          // This index is used for shuffle
          indexName: "byRecipient",
          indexKey({ recipient }) {
            return recipient;
          },
        },
      ],
    }),

    ApprovedApplication: makeEntityDefinition({
      serde: serde.object({
        uid: serde.string,
        recipient: serde.string,
        attester: serde.string,
        schema: serde.string,
        revokedAtBlock: serde.nullable(serde.bigNumber),

        displayName: serde.string,
        applicationMetadataPtrType: serde.number,
        applicationMetadataPtr: serde.string,
        applicantType: serde.string,
        websiteUrl: serde.string,
        bio: serde.string,
        contributionDescription: serde.string,
        contributionLinks: serde.array(
          serde.object({
            type: serde.string,
            url: serde.string,
            description: serde.string,
          })
        ),
        impactCategory: serde.array(serde.string),
        impactDescription: serde.string,
        impactMetrics: serde.array(
          serde.object({
            description: serde.string,
            number: serde.number,
            url: serde.string,
          })
        ),
        fundingSources: serde.array(
          serde.object({
            type: serde.string,
            currency: serde.string,
            amount: serde.number,
            description: serde.string,
          })
        ),
        payoutAddress: serde.string,
        understoodKYCRequirements: serde.boolean,
        understoodFundClaimPeriod: serde.boolean,
        certifiedNotDesignatedOrSanctionedOrBlocked: serde.boolean,
        certifiedNotSponsoredByPoliticalFigureOrGovernmentEntity: serde.boolean,
        certifiedNotBarredFromParticipating: serde.boolean,

        blockNumber: serde.bigNumber,

        superseded: serde.nullable(serde.string),
        supersededBy: serde.nullable(serde.string),

        lists: serde.array(serde.string),
      }),
      indexes: [
        {
          indexName: "byNameAZ",
          indexKey({ displayName }) {
            return efficientLengthEncodingStringDesc(displayName);
          },
        },
        {
          indexName: "byNameZA",
          indexKey({ displayName }) {
            return efficientLengthEncodingStringAsc(displayName);
          },
        },
        {
          // This index is used to be used for shuffle
          indexName: "byBlockNumber",
          indexKey({ blockNumber }) {
            return efficientLengthEncodingNaturalPositiveNumbers(blockNumber);
          },
        },
        {
          // This index is used for shuffle
          indexName: "byRecipient",
          indexKey({ recipient }) {
            return recipient;
          },
        },
      ],
    }),

    List: makeEntityDefinition({
      serde: serde.object({
        uid: serde.string,
        recipient: serde.string,
        attester: serde.string,
        schema: serde.string,
        revokedAtBlock: serde.nullable(serde.bigNumber),

        listName: serde.string,
        listDescription: serde.string,
        impactEvaluationDescription: serde.string,
        impactEvaluationLink: serde.string,
        listContent: serde.array(
          serde.object({
            RPGF3_Application_UID: serde.string,
            OPAmount: serde.number,
          })
        ),

        categories: serde.array(serde.string),

        blockNumber: serde.bigNumber,
      }),
      indexes: [
        {
          indexName: "byNameAZ",
          indexKey({ listName }) {
            return efficientLengthEncodingStringDesc(listName);
          },
        },
        {
          indexName: "byNameZA",
          indexKey({ listName }) {
            return efficientLengthEncodingStringAsc(listName);
          },
        },
        {
          // This index is used for shuffle
          indexName: "byBlockNumber",
          indexKey({ blockNumber }) {
            return efficientLengthEncodingNaturalPositiveNumbers(blockNumber);
          },
        },
      ],
    }),

    OptimistProfile: makeEntityDefinition({
      serde: serde.object({
        uid: serde.string,
        recipient: serde.string,
        attester: serde.string,
        schema: serde.string,
        revokedAtBlock: serde.nullable(serde.bigNumber),

        name: serde.string,
        profileImageUrl: serde.nullable(serde.string),
        bannerImageUrl: serde.nullable(serde.string),
        websiteUrl: serde.nullable(serde.string),
        bio: serde.nullable(serde.string),

        blockNumber: serde.bigNumber,

        superseded: serde.nullable(serde.string),
        supersededBy: serde.nullable(serde.string),
      }),
      indexes: [
        {
          indexName: "byRecipient",
          indexKey({ recipient }) {
            return recipient;
          },
        },
      ],
    }),
  },

  // This filter is applied to all events. If addition events are added that do not require filtering, the filter should be removed
  topicsFilter: [null, null, Object.keys(rpgfSchemas)],

  eventHandlers: [
    {
      signature: "Attested(address,address,bytes32,bytes32)",
      async handle(
        handle,
        { args: { recipient, attester, uid, schema } },
        { blockNumber },
        { easDataFetcher, asyncDataFetcher }
      ) {
        const participant = await handle.loadEntity("Participant", recipient);

        const schemaName = rpgfSchemas[schema];

        if (schemaName) {
          const schemaData = await easDataFetcher.getEASData(uid);

          switch (schemaName) {
            case "BADGEHOLDERS": {
              const badgeholderSchema = decodeBadgeholderSchema(schemaData);

              if (
                attester == badgeholderAttester &&
                badgeholderSchema.rpgfRound == 3
              ) {
                await handle.saveEntity("Badgeholder", uid, {
                  uid,
                  recipient,
                  attester,
                  schema,
                  revokedAtBlock: null,

                  rpgfRound: badgeholderSchema.rpgfRound,
                  referredBy: badgeholderSchema.referredBy,
                  referredMethod: badgeholderSchema.referredMethod,

                  blockNumber: BigNumber.from(blockNumber),
                });

                const delegate = await loadAccount(handle, recipient);
                saveAccount(handle, { ...delegate, isCitizen: true });
              }

              break;
            }
            case "APPLICATION": {
              if (blockNumber > CUTOFF_BLOCK) {
                break;
              }

              const applicationSchema = decodeApplicationSchema(schemaData);
              const applicaitonData = await asyncDataFetcher.getApplicationData(
                applicationSchema.applicationMetadataPtr
              );

              if (applicaitonData) {
                const application = {
                  uid,
                  recipient,
                  attester,
                  schema,
                  revokedAtBlock: null,

                  displayName: applicationSchema.displayName,
                  applicationMetadataPtrType:
                    applicationSchema.applicationMetadataPtrType,
                  applicationMetadataPtr:
                    applicationSchema.applicationMetadataPtr,
                  applicantType: applicaitonData.applicantType,
                  websiteUrl: applicaitonData.websiteUrl,
                  bio: applicaitonData.bio,
                  contributionDescription:
                    applicaitonData.contributionDescription,
                  contributionLinks: applicaitonData.contributionLinks,
                  impactCategory: applicaitonData.impactCategory,
                  impactDescription: applicaitonData.impactDescription,
                  impactMetrics: applicaitonData.impactMetrics,
                  fundingSources: applicaitonData.fundingSources,
                  payoutAddress: applicaitonData.payoutAddress,
                  understoodKYCRequirements:
                    applicaitonData.understoodKYCRequirements,
                  understoodFundClaimPeriod:
                    applicaitonData.understoodFundClaimPeriod,
                  certifiedNotDesignatedOrSanctionedOrBlocked:
                    applicaitonData.certifiedNotDesignatedOrSanctionedOrBlocked,
                  certifiedNotSponsoredByPoliticalFigureOrGovernmentEntity:
                    applicaitonData.certifiedNotSponsoredByPoliticalFigureOrGovernmentEntity,
                  certifiedNotBarredFromParticipating:
                    applicaitonData.certifiedNotBarredFromParticipating,
                  blockNumber: BigNumber.from(blockNumber),

                  lists: [],

                  superseded: null as string | null,
                  supersededBy: null,
                };

                if (participant && participant.application) {
                  const oldApplication = await handle.loadEntity(
                    "Application",
                    participant.application
                  );
                  if (oldApplication) {
                    await handle.saveEntity(
                      "Application",
                      participant.application,
                      {
                        ...oldApplication,
                        supersededBy: uid,
                      }
                    );
                    application.superseded = oldApplication.uid;

                    await handle.saveEntity("Participant", recipient, {
                      ...participant,
                      application: uid,
                    });
                  }
                } else {
                  if (participant) {
                    await handle.saveEntity("Participant", recipient, {
                      ...participant,
                      application: uid,
                    });
                  } else {
                    await handle.saveEntity("Participant", recipient, {
                      recipient,
                      application: uid,
                      profile: null,
                      approvedApplication: null,
                    });
                  }
                }
                await handle.saveEntity("Application", uid, application);
              }

              break;
            }
            case "LISTS": {
              // Only include list created after the cutoff block
              if (blockNumber < LISTS_START_BLOCK) {
                break;
              }
              //  Only badgeholders can create to lists
              const account = await handle.loadEntity("Address", recipient);
              if (!account || !account.isCitizen) {
                break;
              }

              const listSchema = decodeListSchema(schemaData);
              const listData = await asyncDataFetcher.getListData(
                listSchema.listMetadataPtr
              );

              if (listData) {
                for await (const vote of listData.listContent) {
                  const application = await handle.loadEntity(
                    "ApprovedApplication",
                    vote.RPGF3_Application_UID
                  );
                  if (application) {
                    // add list to application
                    application.lists.push(uid);
                    await handle.saveEntity(
                      "ApprovedApplication",
                      application.uid,
                      application
                    );
                  }
                }

                const list = {
                  uid,
                  recipient,
                  attester,
                  schema,
                  revokedAtBlock: null,

                  listName: listSchema.listName,
                  listDescription: listData.listDescription,
                  impactEvaluationDescription:
                    listData.impactEvaluationDescription,
                  impactEvaluationLink: listData.impactEvaluationLink,
                  listContent: listData.listContent,

                  categories: listData.impactCategory || [],

                  blockNumber: BigNumber.from(blockNumber),
                };

                await handle.saveEntity("List", uid, list);
                await updateListsAggregate(handle, list);
                await addToListsTrie(handle, list);
              }

              break;
            }
            case "PROFILE": {
              if (blockNumber > CUTOFF_BLOCK) {
                break;
              }

              const profileSchema = decodeProfileSchema(schemaData);

              {
                const profileData = await asyncDataFetcher.getProfileData(
                  profileSchema.profileMetadataPtr
                );

                const profile = {
                  uid,
                  recipient,
                  attester,
                  schema,
                  revokedAtBlock: null,

                  name: profileSchema.name,
                  profileImageUrl: profileData?.profileImageUrl || null,
                  bannerImageUrl: profileData?.bannerImageUrl || null,
                  websiteUrl: profileData?.websiteUrl || null,
                  bio: profileData?.bio || null,

                  blockNumber: BigNumber.from(blockNumber),

                  superseded: null as string | null,
                  supersededBy: null,
                };

                if (participant && participant.profile) {
                  const oldProfile = await handle.loadEntity(
                    "OptimistProfile",
                    participant.profile
                  );
                  if (oldProfile) {
                    await handle.saveEntity(
                      "OptimistProfile",
                      participant.profile,
                      {
                        ...oldProfile,
                        supersededBy: uid,
                      }
                    );
                    profile.superseded = oldProfile.uid;
                  }

                  await handle.saveEntity("Participant", recipient, {
                    ...participant,
                    profile: uid,
                  });
                } else {
                  if (participant) {
                    await handle.saveEntity("Participant", recipient, {
                      ...participant,
                      profile: uid,
                    });
                  } else {
                    await handle.saveEntity("Participant", recipient, {
                      recipient,
                      profile: uid,
                      application: null,
                      approvedApplication: null,
                    });
                  }
                }

                await handle.saveEntity("OptimistProfile", uid, profile);
              }

              break;
            }

            case "APPLICATION_APPROVAL": {
              const badgeholderSchema =
                decodeApplicationApprovalSchema(schemaData);

              if (
                attester == badgeholderAttester &&
                badgeholderSchema.boolApproved
              ) {
                if (participant && participant.application) {
                  const application = await handle.loadEntity(
                    "Application",
                    participant.application
                  );
                  if (application) {
                    const approvedApplication = {
                      ...application,
                      uid,
                      recipient,
                      attester,
                      schema,
                      revokedAtBlock: null,
                    };
                    if (participant.approvedApplication) {
                      const oldApprovedApplication = await handle.loadEntity(
                        "ApprovedApplication",
                        participant.approvedApplication
                      );
                      if (oldApprovedApplication) {
                        await handle.saveEntity(
                          "ApprovedApplication",
                          participant.approvedApplication,
                          {
                            ...oldApprovedApplication,
                            supersededBy: uid,
                          }
                        );
                        await handle.saveEntity(
                          "ApprovedApplication",
                          uid,
                          approvedApplication
                        );
                        await addToApplicationsTrie(
                          handle,
                          approvedApplication
                        );
                      }
                    } else {
                      await handle.saveEntity(
                        "ApprovedApplication",
                        uid,
                        approvedApplication
                      );
                      await updateApplicationsAggregate(
                        handle,
                        approvedApplication
                      );
                      await addToApplicationsTrie(handle, approvedApplication);
                    }
                  }

                  await handle.saveEntity("Participant", recipient, {
                    ...participant,
                    approvedApplication: uid,
                  });
                } else {
                  if (participant) {
                    await handle.saveEntity("Participant", recipient, {
                      ...participant,
                      approvedApplication: uid,
                    });
                  } else {
                    await handle.saveEntity("Participant", recipient, {
                      recipient,
                      approvedApplication: uid,
                      application: null,
                      profile: null,
                    });
                  }
                }
              }

              break;
            }

            default: {
              break;
            }
          }
        }
      },
    },

    {
      signature: "Revoked(address,address,bytes32,bytes32)",
      async handle(handle, { args: { uid, recipient } }, log) {
        const badgeholder = await handle.loadEntity("Badgeholder", uid);
        const application = await handle.loadEntity("Application", uid);
        const list = await handle.loadEntity("List", uid);
        const profile = await handle.loadEntity("OptimistProfile", uid);
        const participant = await handle.loadEntity("Participant", recipient);
        const approvedApplication = await handle.loadEntity(
          "ApprovedApplication",
          uid
        );

        if (badgeholder) {
          await handle.saveEntity("Badgeholder", uid, {
            ...badgeholder,
            revokedAtBlock: BigNumber.from(log.blockNumber),
          });
          const delegate = await loadAccount(handle, badgeholder.recipient);
          await saveAccount(handle, { ...delegate, isCitizen: false });
        }

        if (application) {
          await handle.saveEntity("Application", uid, {
            ...application,
            revokedAtBlock: BigNumber.from(log.blockNumber),
          });
          if (participant) {
            await reviveSupersededApplication(handle, participant, application);
          }
        }

        if (list) {
          await handle.saveEntity("List", uid, {
            ...list,
            revokedAtBlock: BigNumber.from(log.blockNumber),
          });
          await updateListsAggregateForRemoval(handle, list);
        }

        if (profile) {
          await handle.saveEntity("OptimistProfile", uid, {
            ...profile,
            revokedAtBlock: BigNumber.from(log.blockNumber),
          });
          if (participant) {
            const revivedProfile = await reviveSupersededProfile(
              handle,
              participant,
              profile
            );
            if (revivedProfile) {
              return;
            }
          }
          const address = await handle.loadEntity("Address", profile.recipient);
          if (address) {
            await handle.saveEntity("Address", profile.recipient, {
              ...address,
              isCitizen: false,
            });
          }
        }

        if (approvedApplication) {
          await handle.saveEntity("ApprovedApplication", uid, {
            ...approvedApplication,
            revokedAtBlock: BigNumber.from(log.blockNumber),
          });
          if (participant) {
            await reviveSupersededApprovedApplication(
              handle,
              participant,
              approvedApplication
            );
          }
        }
      },
    },
  ],
});

async function reviveSupersededApplication(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>,
  participant: RuntimeType<
    typeof EASIndexer["entities"]["Participant"]["serde"]
  >,
  application: RuntimeType<
    typeof EASIndexer["entities"]["Application"]["serde"]
  >
) {
  if (application.supersededBy || !application.superseded) {
    return;
  }

  const oldApplication = await handle.loadEntity(
    "Application",
    application.superseded
  );
  if (oldApplication && !oldApplication.revokedAtBlock) {
    await handle.saveEntity("Application", application.superseded, {
      ...oldApplication,
      supersededBy: null,
    });
    participant.application = application.superseded;
    await handle.saveEntity("Participant", participant.recipient, participant);
  }
}

async function reviveSupersededApprovedApplication(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>,
  participant: RuntimeType<
    typeof EASIndexer["entities"]["Participant"]["serde"]
  >,
  approvedApplication: RuntimeType<
    typeof EASIndexer["entities"]["ApprovedApplication"]["serde"]
  >
) {
  if (approvedApplication.supersededBy || !approvedApplication.superseded) {
    return;
  }

  const oldApprovedApplication = await handle.loadEntity(
    "ApprovedApplication",
    approvedApplication.superseded
  );
  if (oldApprovedApplication && !oldApprovedApplication.revokedAtBlock) {
    await handle.saveEntity(
      "ApprovedApplication",
      approvedApplication.superseded,
      {
        ...oldApprovedApplication,
        supersededBy: null,
      }
    );
    participant.application = approvedApplication.superseded;
    await handle.saveEntity("Participant", participant.recipient, participant);
  } else {
    await updateApplicationsAggregateForRemoval(handle, approvedApplication);
  }
}

async function reviveSupersededProfile(
  // @ts-ignore
  handle: StorageHandleForIndexer<typeof EASIndexer>,
  participant: RuntimeType<
    typeof EASIndexer["entities"]["Participant"]["serde"]
  >,
  profile: RuntimeType<
    typeof EASIndexer["entities"]["OptimistProfile"]["serde"]
  >
) {
  if (profile.supersededBy || !profile.superseded) {
    return;
  }

  const oldProfile = await handle.loadEntity(
    "OptimistProfile",
    profile.superseded
  );
  if (oldProfile && !oldProfile.revokedAtBlock) {
    await handle.saveEntity("OptimistProfile", profile.superseded, {
      ...oldProfile,
      supersededBy: null,
    });
    participant.application = profile.superseded;
    await handle.saveEntity("Participant", participant.recipient, participant);

    return oldProfile;
  }
}

export function decodeBadgeholderSchema(schemaData: string): BadgeholderSchema {
  const signature =
    "SCHEMA_ENCODING(string rpgfRound,address referredBy,string referredMethod)";

  const dataArgs = ethers.utils.FunctionFragment.fromString(signature);

  const decodedData = ethers.utils.defaultAbiCoder.decode(
    dataArgs.inputs,
    schemaData
  ) as ethers.utils.Result<BadgeholderSchema>;

  return decodedData;
}

interface BadgeholderSchema {
  rpgfRound: number;
  referredBy: string;
  referredMethod: string;
}

export function decodeApplicationSchema(schemaData: string): ApplicaitonSchema {
  const signature =
    "SCHEMA_ENCODING(string displayName,uint256 applicationMetadataPtrType,string applicationMetadataPtr)";

  const dataArgs = ethers.utils.FunctionFragment.fromString(signature);

  const decodedData = ethers.utils.defaultAbiCoder.decode(
    dataArgs.inputs,
    schemaData
  ) as ethers.utils.Result<ApplicaitonSchema>;

  return decodedData;
}

interface ApplicaitonSchema {
  displayName: string;
  applicationMetadataPtrType: number;
  applicationMetadataPtr: string;
}

export function decodeListSchema(schemaData: string): ListSchema {
  const signature =
    "SCHEMA_ENCODING(string listName,uint256 listMetadataPtrType,string listMetadataPtr)";

  const dataArgs = ethers.utils.FunctionFragment.fromString(signature);

  const decodedData = ethers.utils.defaultAbiCoder.decode(
    dataArgs.inputs,
    schemaData
  ) as ethers.utils.Result<ListSchema>;

  return decodedData;
}

interface ListSchema {
  listName: string;
  listMetadataPtrType: number;
  listMetadataPtr: string;
}

export function decodeProfileSchema(schemaData: string): ProfileSchema {
  const signature =
    "SCHEMA_ENCODING(string name,uint256 profileMetadataPtrType,string profileMetadataPtr)";

  const dataArgs = ethers.utils.FunctionFragment.fromString(signature);

  const decodedData = ethers.utils.defaultAbiCoder.decode(
    dataArgs.inputs,
    schemaData
  ) as ethers.utils.Result<ProfileSchema>;

  return decodedData;
}

interface ProfileSchema {
  name: string;
  profileMetadataPtrType: number;
  profileMetadataPtr: string;
}

export function decodeApplicationApprovalSchema(
  schemaData: string
): ApplicationApprovalSchema {
  const signature = "SCHEMA_ENCODING(bool boolApproved)";

  const dataArgs = ethers.utils.FunctionFragment.fromString(signature);

  const decodedData = ethers.utils.defaultAbiCoder.decode(
    dataArgs.inputs,
    schemaData
  ) as ethers.utils.Result<ApplicationApprovalSchema>;

  return decodedData;
}

interface ApplicationApprovalSchema {
  boolApproved: boolean;
}
