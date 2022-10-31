import { DrawDependencies, initSync } from "../../../render-opengraph/pkg";
import wasm from "../../../render-opengraph/pkg/render_opengraph_bg.wasm";

let drawDependenciesPromise = null;

export function getDrawDependencies(
  kv: KVNamespace,
  manifest: Record<string, string>
): Promise<DrawDependencies> {
  if (drawDependenciesPromise) {
    return drawDependenciesPromise;
  }

  drawDependenciesPromise = (async () => {
    initSync(wasm);

    const [imagesRaw, interMedium, interBlack, dejavuBold] = await Promise.all([
      kv.get(manifest["worker-assets/image-data.json"], "text"),
      kv.get(manifest["worker-assets/Inter-Medium.otf"], "arrayBuffer"),
      kv.get(manifest["worker-assets/Inter-Black.otf"], "arrayBuffer"),
      kv.get(manifest["worker-assets/DejaVuSans-Bold.ttf"], "arrayBuffer"),
    ]);

    return DrawDependencies.create(
      imagesRaw,
      new Uint8Array(interMedium),
      new Uint8Array(interBlack),
      new Uint8Array(dejavuBold)
    );
  })();

  return drawDependenciesPromise;
}
