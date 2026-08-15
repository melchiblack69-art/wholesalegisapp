import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import CompanyDetail from "./pages/CompanyDetail";
import Categories from "./pages/Categories";
import MapPage from "./pages/MapPage";
import Favorites from "./pages/Favorites";
import Menu from "./pages/Menu";
import Directions from "./pages/Directions";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProfileDisplay from "./pages/Profile";
import MaintenancePage from "./pages/Maintenance";
import { useSystemSettings } from "./context/SystemSettingsContext";
import LoadingSpinner from "./components/LoadingSpinner";

function StartupGate({ children }) {
  const { loaded, maintenance_mode } = useSystemSettings();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (loaded && maintenance_mode && location.pathname !== "/maintenance") {
      navigate("/maintenance", { replace: true });
    }
  }, [loaded, maintenance_mode, location.pathname, navigate]);
  if (!loaded) return <LoadingSpinner fullScreen />;
  if (maintenance_mode) return <MaintenancePage />;
  return children;
}

export default function App() {
  return <StartupGate><>
    <ScrollToTop />
    <Routes>
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/companies" element={<SearchResults />} />
        <Route path="/companies/:id" element={<CompanyDetail />} />
        <Route path="/companies/:id/directions" element={<Directions />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<ProfileDisplay />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  </> </StartupGate>;
}
