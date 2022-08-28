import React, { Suspense } from "react";
import logo from "./logo.svg";
import "./App.css";
import graphql from 'babel-plugin-relay/macro';
import {
  RelayEnvironmentProvider,
  useLazyLoadQuery,
} from "react-relay/hooks";
import { relayEnvironment } from "./relayEnvironment";
import {AppQuery} from "./__generated__/AppQuery.graphql";

function App() {
  return (
    <RelayEnvironmentProvider environment={relayEnvironment}>
      <Suspense fallback={null}>
        <AppContents />
      </Suspense>
    </RelayEnvironmentProvider>
  );
}

function AppContents() {
  const query = useLazyLoadQuery<AppQuery>(
    graphql`
      query AppQuery {
        delegates {
          id
        }
      }
    `,
    {}
  );

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
          <pre>
              {JSON.stringify(query, undefined, '\t')}
          </pre>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
