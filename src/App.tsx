import React, { Suspense } from "react";
import { RelayEnvironmentProvider } from "react-relay/hooks";
import { relayEnvironment } from "./relayEnvironment";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { DelegatePage } from "./pages/DelegatePage";

function App() {
  return (
    <React.StrictMode>
      <RelayEnvironmentProvider environment={relayEnvironment}>
        <Suspense fallback={null}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/delegate/:delegateId" element={<DelegatePage />} />
            </Routes>
          </BrowserRouter>
        </Suspense>
      </RelayEnvironmentProvider>
    </React.StrictMode>
  );
}

export default App;
