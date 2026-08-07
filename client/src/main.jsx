import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "leaflet/dist/leaflet.css";
import "./styles/theme.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FavoritesProvider } from "./context/FavoritesContext.jsx";
import { SystemSettingsProvider } from "./context/SystemSettingsContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <SystemSettingsProvider>
        <AuthProvider>
          <FavoritesProvider>
            <App />
          </FavoritesProvider>
        </AuthProvider>
      </SystemSettingsProvider>
    </BrowserRouter>
  </StrictMode>
);