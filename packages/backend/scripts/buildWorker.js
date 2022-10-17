const { default: wasmpack } = require("esbuild-plugin-wasm-pack");
const { copy } = require("esbuild-plugin-copy");
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
    plugins: [
      wasmpack({
        target: "web",
        path: "../render-opengraph",
      }),
      copy({
        assets: [
          {
            from: "../render-opengraph/resources/*",
            to: "../../frontend/build/worker-assets/files",
          },
          {
            from: "../../node_modules/@nouns/assets/dist/image-data.json",
            to: "../../frontend/build/worker-assets/image-data.json",
          },
        ],
      }),
    ],
    format: "esm",
    metafile: true,
    entryPoints: ["src/worker.ts"],
  });

  await fs.writeFile("dist/meta.json", JSON.stringify(result.metafile));
}

main();
