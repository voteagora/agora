const { promises: fs } = require("fs");
const esbuild = require("esbuild");
const {
  default: graphqlLoaderPlugin,
} = require("@luckycatfactory/esbuild-graphql-loader");

async function main() {
  const result = await esbuild.build({
    external: ["__STATIC_CONTENT_MANIFEST", "node:async_hooks"],
    bundle: true,
    sourcemap: true,
    outfile: "dist/worker.js",
    loader: {
      ".wasm": "copy",
    },
    plugins: [graphqlLoaderPlugin()],
    format: "esm",
    metafile: true,
    entryPoints: ["src/worker/index.ts"],
  });

  await fs.writeFile("dist/meta.json", JSON.stringify(result.metafile));
}

main();
