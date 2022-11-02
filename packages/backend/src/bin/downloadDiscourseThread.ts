import { fetchPost, fetchThread } from "../discourse";
import { promises as fs } from "fs";

const baseUrl = "https://discuss.ens.domains";

async function main() {
  const thread = await fetchThread({
    baseUrl,
    threadId: 815,
  });

  await fs.writeFile(
    "./data/discourse/threads/815.json",
    JSON.stringify(thread)
  );

  for (const post of thread.post_stream.posts) {
    const fetchedPost = await fetchPost({
      baseUrl,
      postId: post.id,
    });

    await fs.writeFile(
      `./data/discourse/posts/${post.id}`,
      JSON.stringify(fetchedPost)
    );

    console.log({ post });
  }
}

main();
