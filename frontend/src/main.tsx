import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { I18nProvider } from "./i18n/context";
import { WalletProvider } from "./lib/walletContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <WalletProvider>
          <App />
        </WalletProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
);