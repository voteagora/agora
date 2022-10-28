declare module "__STATIC_CONTENT_MANIFEST" {
  const manifestJSON: string;
  export default manifestJSON;
}

declare module "*.wasm" {
  const module: WebAssembly.Module;
  export default module;
}
