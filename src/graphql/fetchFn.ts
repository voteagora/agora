export async function fetchFn(query: string | null, variables?: object) {
  const response = await fetch(
    "https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    }
  );

  return await response.json();
}
