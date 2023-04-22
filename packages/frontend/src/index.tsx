import "./sentry";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./index.css";
import { ErrorBoundary } from "@sentry/react";
import ReactGA from "react-ga";

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
