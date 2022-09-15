import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  release: process.env.REACT_APP_GITHUB_SHA,
  environment: process.env.REACT_APP_DEPLOY_ENV,
  integrations: [new BrowserTracing()],

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});
