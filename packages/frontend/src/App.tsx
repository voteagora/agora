import React, { Suspense } from "react";
import { RelayEnvironmentProvider } from "react-relay/hooks";
import { relayEnvironment } from "./relayEnvironment";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createClient, WagmiConfig } from "wagmi";
import { ConnectKitProvider, getDefaultClient } from "connectkit";
import { PageContainer } from "./components/PageContainer";
import { PageHeader } from "./components/PageHeader";
import {
  HammockRouter,
  HammockRouterContents,
} from "./components/HammockRouter/HammockRouter";

const wagmiClient = createClient(
  getDefaultClient({
    appName: "Nouns Agora",
    alchemyId: process.env.REACT_APP_ALCHEMY_ID,
  })
);

function App() {
  const queryClient = new QueryClient();

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig client={wagmiClient}>
          <ConnectKitProvider>
            <RelayEnvironmentProvider environment={relayEnvironment}>
              <HammockRouter>
                <PageContainer>
                  <PageHeader />

                  <Suspense fallback={null}>
                    <HammockRouterContents />
                  </Suspense>
                </PageContainer>
              </HammockRouter>
            </RelayEnvironmentProvider>
          </ConnectKitProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
