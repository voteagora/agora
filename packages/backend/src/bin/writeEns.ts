import { promises as fs } from "fs";
import { z } from "zod";
import { fetchPostResponse } from "../discourse";
import path from "path";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  makeDynamoDelegateStore,
  makeMergedDelegateKey,
} from "../store/dynamo/delegates";
import { resolveNameFromAddress } from "../utils/resolveName";
import { ethers } from "ethers";
import { setFields, TableName, updateExpression } from "../store/dynamo/utils";
import { makeStoredStatement } from "../presetStatements";

async function discoursePostsByNumber() {
  const postsFolder = "./data/discourse/posts/";
  const postFiles = await fs.readdir(postsFolder);

  const mapping = new Map<number, z.infer<typeof fetchPostResponse>>();
  for (const file of postFiles) {
    const contents = await fs.readFile(path.join(postsFolder, file), {
      encoding: "utf-8",
    });

    const response = fetchPostResponse.parse(JSON.parse(contents));

    mapping.set(response.post_number, response);
  }

  return mapping;
}

async function main() {
  const provider = new ethers.providers.CloudflareProvider();
  const discoursePostMapping = await discoursePostsByNumber();

  const dynamo = new DynamoDB({});
  const delegateStore = makeDynamoDelegateStore(dynamo);

  const first = 30;
  const maxPages = 10;
  let after = undefined;

  for (let i = 0; i < maxPages; i++) {
    const delegatesPage = await delegateStore.getDelegates({
      orderBy: "mostVotingPower",
      first,
      after,
    });

    for (const { node } of delegatesPage.edges) {
      console.log({ node });
      try {
        const resolvedName = await resolveNameFromAddress(
          node.address,
          provider
        );

        const resolver = await (async () => {
          if (!resolvedName) {
            return null;
          }

          return await provider.getResolver(resolvedName);
        })();

        const statement = await (async () => {
          if (!resolver) {
            return null;
          }

          return makeStoredStatement(node.address, {
            twitter: await resolver.getText("com.twitter"),
            delegateStatement: await (async () => {
              const delegateValue = await resolver.getText("eth.ens.delegate");
              if (!delegateValue) {
                return null;
              }

              const withoutPrefix = stripPrefix(
                delegateValue,
                "https://discuss.ens.domains/t/ens-dao-delegate-applications/815/"
              );
              if (!withoutPrefix) {
                return null;
              }

              const post = discoursePostMapping.get(parseInt(withoutPrefix));

              return post.raw;
            })(),
          });
        })();

        await dynamo.updateItem({
          TableName,
          Key: makeMergedDelegateKey(node.address.toString()),

          ...updateExpression((exp) => {
            setFields(exp, {
              ...(() => {
                if (!statement) {
                  return;
                }

                return {
                  statement,
                };
              })(),
              resolvedName,
            });
          }),
        });
      } catch (e) {
        console.error(e);
      }
    }

    if (!delegatesPage.pageInfo.hasNextPage) {
      return;
    }

    after = delegatesPage.pageInfo.endCursor;
  }
}

main();

function stripPrefix(str: string, prefix: string) {
  if (str.startsWith(prefix)) {
    return str.replace(prefix, "");
  }

  return null;
}
