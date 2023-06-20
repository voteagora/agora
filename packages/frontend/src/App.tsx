import React, { Suspense } from "react";
import { mainnet, sepolia } from "wagmi/chains";
import { RelayEnvironmentProvider } from "react-relay/hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createClient, WagmiConfig } from "wagmi";
import { ConnectKitProvider, getDefaultClient } from "connectkit";
import { Toaster } from "react-hot-toast";
import { RecoilRoot } from "recoil";

import { relayEnvironment } from "./relayEnvironment";
import { PageContainer } from "./components/PageContainer";
import { PageHeader } from "./components/PageHeader";
import {
  HammockRouter,
  HammockRouterContents,
} from "./components/HammockRouter/HammockRouter";
import { FullPageLoadingIndicator } from "./components/FullPageLoadingIndicator";
import { DialogProvider } from "./components/DialogProvider/DialogProvider";

const wagmiClient = createClient(
  getDefaultClient({
    appName: "Nouns Agora",
    chains: import.meta.env.VITE_DEPLOY_ENV !== "prod" ? [sepolia] : [mainnet],
    walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_ID || "",
    alchemyId: import.meta.env.VITE_ALCHEMY_ID || "",
  })
);

function App() {
  const queryClient = new QueryClient();

  return (
    <React.StrictMode>
      <RecoilRoot>
        <QueryClientProvider client={queryClient}>
          <WagmiConfig client={wagmiClient}>
            <ConnectKitProvider options={{ walletConnectCTA: "both" }}>
              <RelayEnvironmentProvider environment={relayEnvironment}>
                <HammockRouter>
                  <DialogProvider>
                    <PageContainer>
                      <Toaster />
                      <Suspense fallback={<FullPageLoadingIndicator />}>
                        <PageHeader />

                        <HammockRouterContents />
                      </Suspense>
                    </PageContainer>
                  </DialogProvider>
                </HammockRouter>
              </RelayEnvironmentProvider>
            </ConnectKitProvider>
          </WagmiConfig>
        </QueryClientProvider>
      </RecoilRoot>
    </React.StrictMode>
  );
}

export default App;
