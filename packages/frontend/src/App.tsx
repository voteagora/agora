import React, { Suspense } from "react";
import { Helmet } from "react-helmet";
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
import { RetroPGFVoterStoreProvider } from "./pages/RetroPGFPage/RetroPGFVoterStore/RetroPGFVoterStoreContext";

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
    fetch(`${process.env.PUBLIC_URL}/api/auth/nonce`).then(async (res) => {
      const result = await res.json();
      localStorage.setItem("nonce", result.nonce);

      return result.nonce;
    }),
  createMessage: ({ nonce, address, chainId }) => {
    const storageNonce = localStorage.getItem("nonce");
    const message = new SiweMessage({
      version: "1",
      domain: window.location.host,
      uri: window.location.origin,
      address,
      chainId,
      nonce: storageNonce || nonce,
      statement: "Sign in to Agora Optimism",
    }).prepareMessage();

    return message;
  },
  verifyMessage: async ({ message, signature }) => {
    const nonce = localStorage.getItem("nonce");
    return fetch(`${process.env.PUBLIC_URL}/api/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, signature, nonce }),
    }).then(async (res) => {
      const accessToken = (await res.json()).accessToken;
      localStorage.setItem("accessToken", accessToken);
      return accessToken;
    });
  },
  getSession: async () => {
    const accessToken = localStorage.getItem("accessToken");

    return fetch(`${process.env.PUBLIC_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(async (res) => {
      if (res.ok) {
        const result = await res.json();
        return result.session;
      } else {
        return null;
      }
    });
  },
  signOut: async () => {
    localStorage.removeItem("accessToken");
    return true;
  },

  enabled: false,
};

function App() {
  const queryClient = new QueryClient();

  // Dynamic meta tags
  const title = "Agora - Home of Optimism Voters";
  const description = "Agora is the home of Optimism voters.";

  return (
    <React.StrictMode>
      <Helmet>
        <title>Agora - Home of Optimism Voters</title>
        <meta
          name="description"
          content="Agora is the home of Optimism voters."
        />
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
      </Helmet>
      <RecoilRoot>
        <QueryClientProvider client={queryClient}>
          <WagmiConfig config={wagmiClient}>
            <ENSAvatarProvider>
              <SIWEProvider {...siweConfig}>
                <ConnectKitProvider options={{ walletConnectCTA: "both" }}>
                  <RelayEnvironmentProvider environment={relayEnvironment}>
                    <RetroPGFVoterStoreProvider>
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
                    </RetroPGFVoterStoreProvider>
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
