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
import { FullPageLoadingIndicator } from "./components/FullPageLoadingIndicator";
import { Toaster } from "react-hot-toast";
import { RecoilRoot } from "recoil";
import { DialogProvider } from "./components/DialogProvider/DialogProvider";

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
      <RecoilRoot>
        <QueryClientProvider client={queryClient}>
          <WagmiConfig client={wagmiClient}>
            <ConnectKitProvider>
              <RelayEnvironmentProvider environment={relayEnvironment}>
                <DialogProvider>
                  <HammockRouter>
                    <PageContainer>
                      <Toaster />
                      <Suspense fallback={<FullPageLoadingIndicator />}>
                        <PageHeader />

                        <HammockRouterContents />
                      </Suspense>
                    </PageContainer>
                  </HammockRouter>
                </DialogProvider>
              </RelayEnvironmentProvider>
            </ConnectKitProvider>
          </WagmiConfig>
        </QueryClientProvider>
      </RecoilRoot>
    </React.StrictMode>
  );
}

export default App;
