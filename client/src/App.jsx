import { Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
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
    </>
  );
}
