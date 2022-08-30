import React, { Suspense } from "react";
import { RelayEnvironmentProvider } from "react-relay/hooks";
import { relayEnvironment } from "./relayEnvironment";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { DelegatePage } from "./pages/DelegatePage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const client = new QueryClient();

  return (
    <React.StrictMode>
      <QueryClientProvider client={client}>
        <RelayEnvironmentProvider environment={relayEnvironment}>
          <Suspense fallback={null}>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/delegate/:delegateId"
                  element={<DelegatePage />}
                />
              </Routes>
            </BrowserRouter>
          </Suspense>
        </RelayEnvironmentProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
