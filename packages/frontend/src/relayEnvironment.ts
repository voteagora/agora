import { Environment, Network, RecordSource, Store } from "relay-runtime";

const network = Network.create((request, variables) =>
  fetchFn(request.text, variables)
);

const recordSource = new RecordSource();

const store = new Store(recordSource);

export const relayEnvironment = new Environment({
  network,
  store,
});

async function fetchFn(query: string | null, variables?: object) {
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
