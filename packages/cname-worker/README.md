# cname-worker

A worker which trampolines requests to cname.voteagora.com from external
domains to the corresponding worker. For traffic where the zone is in the same
account as the worker, (like nounsagora.com) we should configure custom routes
directly on the worker instead as there seems to be something blocking traffic
from zones in an account to a worker without a custom domain configured for
that worker.

## Why?

This is necessary because:

- A worker's custom domain can only be configured for SSL certs a zone
  configured by the cloudflare account the worker is in.

- If site is available under a custom domain, it will become public. We want a
  single cannonical route, not many. The single cannonical route should be the
  only way to access a specific deployment (might revisit this decision later).
