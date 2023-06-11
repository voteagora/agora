# frontend

## Prerequisites

[Watchman](https://facebook.github.io/watchman/docs/install)

## Running

```sh
$ yarn start
```

## Proxy

To point to an existing deployed backend, update the [server.proxy] field in the
vite.config.ts

```patch
Index: packages/frontend/vite.config.ts
IDEA additional info:
Subsystem: com.intellij.openapi.diff.impl.patch.CharsetEP
<+>UTF-8
===================================================================
diff --git a/packages/frontend/vite.config.ts b/packages/frontend/vite.config.ts
--- a/packages/frontend/vite.config.ts	(revision 7146b8daa59a589b08b66a5a76f3e2c3f9b9bb48)
+++ b/packages/frontend/vite.config.ts	(date 1682354849648)
@@ -35,7 +35,7 @@
   },
   server: {
     proxy: {
-      "/graphql": "http://0.0.0.0:4001/",
+      "/graphql": "https://nouns-agora-dev.act.workers.dev/",
     },
   },
 });
```

[server.proxy]: https://vitejs.dev/config/server-options.html#server-proxy

## Local development

Set the `VITE_DEPLOY_ENV` env variable to `dev` or `prod` if you want to respectively point the frontend to Sepolia or Mainnet environments.

Both the deployed dev backend and the default backend configuration `ENVIRONMENT=dev` point to the Sepolia testnet contracts.

> Note: If the backend is running locally, `VITE_DEPLOY_ENV` should have the same value as `ENVIRONMENT`. If it's pointing to an existing deployed backend, `VITE_DEPLOY_ENV` should be set based on the backend's env.

### Testnet environment

The testnet environment is made of the following contracts:

- [NounsToken at 0x05d570185F6e2d29AdaBa1F36435f50Bc44A6f17](https://sepolia.etherscan.io/address/0x05d570185F6e2d29AdaBa1F36435f50Bc44A6f17)
- [Governor at 0x461208f0073e3b1C9Cec568DF2fcACD0700C9B7a](https://sepolia.etherscan.io/address/0x461208f0073e3b1C9Cec568DF2fcACD0700C9B7a)
- [Alligator at 0x40Cc6dA4FE4000997cF1ca72e30181eAD6154F83](https://sepolia.etherscan.io/address/0x40Cc6dA4FE4000997cF1ca72e30181eAD6154F83)

Main differences from mainnet:

- You can mint NounsTokens for free by calling the function `mint(address)` on Etherscan. This function can be called by anyone and mints 1 Noun to the specified address.
- Only 1 Nouns is needed to create proposals, instead of the 2 needed on real Nouns on mainnet. Proposals can be created on Etherscan by calling `propose` on the Governor contract
