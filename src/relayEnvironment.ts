import { Environment, Network, RecordSource, Store } from "relay-runtime";
import { fetchFn } from "./graphql/fetchFn";

const network = Network.create((request, variables) =>
  fetchFn(request.text, variables)
);

const recordSource = new RecordSource();

const store = new Store(recordSource);

export const relayEnvironment = new Environment({
  network,
  store,
});
