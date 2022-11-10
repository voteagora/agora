const { promises: fs } = require("fs");
const esbuild = require("esbuild");

async function main() {
  const result = await esbuild.build({
    external: ["__STATIC_CONTENT_MANIFEST"],
    bundle: true,
    sourcemap: true,
    outfile: "dist/worker.js",
    loader: {
      ".graphql": "text",
      ".wasm": "copy",
    },
    format: "esm",
    metafile: true,
    entryPoints: ["src/worker/index.ts"],
  });

  await fs.writeFile("dist/meta.json", JSON.stringify(result.metafile));
}

main();
