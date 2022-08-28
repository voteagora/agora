import {
  Environment,
  Network,
  RecordSource,
  RequestParameters,
  Store,
} from "relay-runtime";

async function fetchFn(params: RequestParameters, variables: object) {
  const response = await fetch(
    "https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: params.text,
        variables,
      }),
    }
  );

  return await response.json();
}

const network = Network.create(fetchFn);

const recordSource = new RecordSource();

const store = new Store(recordSource);

export const relayEnvironment = new Environment({
  network,
  store,
});
