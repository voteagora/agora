import "./sentry";

import { ErrorBoundary } from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom/client";
import ReactGA from "react-ga";

import "./index.css";
import App from "./App";

ReactGA.initialize([
  {
    trackingId: process.env.REACT_APP_GOOGLE_ANALYTICS_ID!,
  },
]);

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
