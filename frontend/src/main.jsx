import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "leaflet/dist/leaflet.css";
import "./styles/theme.css";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";
import { GlobalLoader } from "./context/GlobalLoaderContext.jsx";
import { SystemSettingsProvider } from "./context/SystemSettingsContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SystemSettingsProvider>
        <ModalProvider>
          <App />
          <GlobalLoader />
        </ModalProvider>
        </SystemSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
