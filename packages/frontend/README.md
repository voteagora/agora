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
