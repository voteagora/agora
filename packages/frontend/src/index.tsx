/**
 * window.global is required by wallet-connect (a dependency of connectkit).
 * This is a bug in the library. Changing the vite.config.ts to use
 * `define: { "window.global": "window" }` applies too broadly causing sentry
 * to not build properly.
 */
window.global ||= window;

import "./sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { ErrorBoundary } from "@sentry/react";
import ReactGA from "react-ga";

import App from "./App";

ReactGA.initialize([
  {
    trackingId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID!,
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
