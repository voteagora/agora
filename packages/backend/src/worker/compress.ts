import wasm from "brotli-wasm/pkg.web/brotli_wasm_bg.wasm";
import init, { compress, decompress } from "brotli-wasm/pkg.web/brotli_wasm";

let compressPromise = null;

export async function getCompressor() {
  if (compressPromise) {
    return compressPromise;
  }

  compressPromise = (async () => {
    await init(wasm);

    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();

    return {
      compress(value: string) {
        const buffer = textEncoder.encode(value);
        return compress(buffer, { quality: 0 });
      },
      decompress(value: Uint8Array) {
        const decompressed = decompress(value);
        return textDecoder.decode(decompressed);
      },
    };
  })();
}
