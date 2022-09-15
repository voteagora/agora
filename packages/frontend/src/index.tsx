import "./sentry";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./index.css";
import { ErrorBoundary } from "@sentry/react";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
