import React, { Suspense } from "react";
import { RelayEnvironmentProvider } from "react-relay/hooks";
import { relayEnvironment } from "./relayEnvironment";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, WagmiConfig } from "wagmi";
import {
  ConnectKitProvider,
  SIWEConfig,
  SIWEProvider,
  getDefaultConfig,
} from "connectkit";
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
import { optimism } from "wagmi/chains";
import { ENSAvatarProvider } from "./components/ENSAvatar";
import { SiweMessage } from "siwe";

const wagmiClient = createConfig(
  getDefaultConfig({
    appName: "Agora",
    walletConnectProjectId:
      process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || "",
    alchemyId: process.env.REACT_APP_ALCHEMY_ID || "",
    chains: [optimism],
  })
);

const siweConfig: SIWEConfig = {
  getNonce: async () =>
    fetch("api/auth/nonce").then(async (res) => {
      const result = await res.json();
      console.log(result);
      return result.nonce;
    }),
  createMessage: ({ nonce, address, chainId }) => {
    const message = new SiweMessage({
      version: "1",
      domain: window.location.host,
      uri: window.location.origin,
      address,
      chainId,
      nonce,
      statement: "Sign in to Agora Optimism",
    }).prepareMessage();

    console.log("create message", message);

    return message;
  },
  verifyMessage: async ({ message, signature }) =>
    fetch("api/auth/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, signature }),
    }).then((res) => {
      console.log(res);
      return res.json();
    }),
  getSession: async () => fetch("api/auth/session").then((res) => res.json()),
  signOut: async () => fetch("api/auth/signout").then((res) => res.json()),
};

function App() {
  const queryClient = new QueryClient();

  return (
    <React.StrictMode>
      <RecoilRoot>
        <QueryClientProvider client={queryClient}>
          <WagmiConfig config={wagmiClient}>
            <ENSAvatarProvider>
              <SIWEProvider {...siweConfig}>
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
              </SIWEProvider>
            </ENSAvatarProvider>
          </WagmiConfig>
        </QueryClientProvider>
      </RecoilRoot>
    </React.StrictMode>
  );
}

export default App;
