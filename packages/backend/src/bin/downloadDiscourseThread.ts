import "isomorphic-fetch";
import { ethers } from "ethers";
import { fetchPost, fetchThread } from "../discourse";
import * as fs from "fs";

const baseUrl = "https://discuss.ens.domains";

async function main() {
  const threadId = 815;
  const thread = await fetchThread({
    baseUrl,
    threadId,
  });

  await fs.promises.writeFile(
    "./data/discourse/threads/815.json",
    JSON.stringify(thread)
  );

  for (const postId of thread.post_stream.stream) {
    const fileExists = fs.existsSync(`./data/discourse/posts/${postId}.json`);
    if (fileExists) {
      continue;
    }

    try {
      const fetchedPost = await fetchPost({
        baseUrl,
        postId,
      });

      await fs.promises.writeFile(
        `./data/discourse/posts/${postId}.json`,
        JSON.stringify(fetchedPost)
      );

      console.log({ postId });
    } catch (e) {
      console.error({ postId, e });
    }
  }
}

main();
