import { ethers, BigNumber } from "ethers";
import { makeContractInstance } from "../../contracts";
import { EAS__factory } from "../../contracts/generated";
import { makeEntityDefinition, makeIndexerDefinition } from "../process";
import * as serde from "../serde";

const EASContract = makeContractInstance({
  iface: EAS__factory.createInterface(),
  address: "0x4200000000000000000000000000000000000021",
  startingBlock: 6490467,
});

const rpgfSchemas: { [key: string]: string } = {
  "0xfdcfdad2dbe7489e0ce56b260348b7f14e8365a8a325aef9834818c00d46b31b":
    "BADGEHOLDERS",
  "0x76e98cce95f3ba992c2ee25cef25f756495147608a3da3aa2e5ca43109fe77cc":
    "APPLICATION",
  "0x3e3e2172aebb902cf7aa6e1820809c5b469af139e7a4265442b1c22b97c6b2a5": "LISTS",
};

const badgeholderAttester = "0x621477dBA416E12df7FF0d48E14c4D20DC85D7D9";

export const EASIndexer = makeIndexerDefinition(EASContract, {
  name: "EAS",

  entities: {
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
      }),
      indexes: [
        {
          indexName: "byDisplayName",
          indexKey({ displayName }) {
            return displayName;
          },
        },
        {
          indexName: "byApplicantType",
          indexKey({ applicantType }) {
            return applicantType;
          },
        },
        {
          indexName: "byImpactCategory",
          indexKey({ impactCategory }) {
            return impactCategory[0]; // TODO: support multiple categories
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
      }),
      indexes: [
        {
          indexName: "byListName",
          indexKey({ listName }) {
            return listName;
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
        _,
        { easDataFetcher, asyncDataFetcher }
      ) {
        const schemaName = rpgfSchemas[schema];

        if (schemaName) {
          const schemaData = await easDataFetcher.getEASData(uid);

          switch (schemaName) {
            case "BADGEHOLDERS": {
              const badgeholderSchema = decodeBadgeholderSchema(schemaData);

              if (attester == badgeholderAttester) {
                handle.saveEntity("Badgeholder", uid, {
                  uid,
                  recipient,
                  attester,
                  schema,
                  revokedAtBlock: null,

                  rpgfRound: badgeholderSchema.rpgfRound,
                  referredBy: badgeholderSchema.referredBy,
                  referredMethod: badgeholderSchema.referredMethod,
                });
              }

              break;
            }
            case "APPLICATION": {
              const applicationSchema = decodeApplicationSchema(schemaData);
              const applicaitonData = await asyncDataFetcher.getApplicationData(
                applicationSchema.applicationMetadataPtr
              );

              if (!applicaitonData) {
                throw new Error(
                  `Application data not found for ${applicationSchema.displayName}`
                );
              }

              handle.saveEntity("Application", uid, {
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
              });

              break;
            }
            case "LISTS": {
              const listSchema = decodeListSchema(schemaData);
              const listData = await asyncDataFetcher.getListData(
                listSchema.listMetadataPtr
              );

              if (!listData) {
                throw new Error(
                  `Application data not found for ${listSchema.listName}`
                );
              }

              handle.saveEntity("List", uid, {
                uid,
                recipient,
                attester,
                schema,
                revokedAtBlock: null,

                listName: listData.listName,
                listDescription: listData.listDescription,
                impactEvaluationDescription:
                  listData.impactEvaluationDescription,
                impactEvaluationLink: listData.impactEvaluationLink,
                listContent: listData.listContent,
              });

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
      async handle(handle, { args: { uid } }, log) {
        const badgeholder = await handle.loadEntity("Badgeholder", uid);
        const application = await handle.loadEntity("Application", uid);
        const list = await handle.loadEntity("List", uid);

        if (badgeholder) {
          handle.saveEntity("Badgeholder", uid, {
            ...badgeholder,
            revokedAtBlock: BigNumber.from(log.blockNumber),
          });
        }

        if (application) {
          handle.saveEntity("Application", uid, {
            ...application,
            revokedAtBlock: BigNumber.from(log.blockNumber),
          });
        }

        if (list) {
          handle.saveEntity("List", uid, {
            ...list,
            revokedAtBlock: BigNumber.from(log.blockNumber),
          });
        }
      },
    },
  ],
});

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
