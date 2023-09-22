import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

export function startProxyServer() {
  const app = express();

  app.use(
    "/graphql",
    createProxyMiddleware({
      target: "http://0.0.0.0:4002/",
      changeOrigin: true,
    })
  );
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://0.0.0.0:4003/",
      changeOrigin: true,
    })
  );

  app.listen(4001);
}
