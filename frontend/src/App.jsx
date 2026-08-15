import { Navigate, Routes, Route } from "react-router-dom";
import { useEffect} from 'react';
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import CompanyForm from "./pages/CompanyForm";
import CompanyView from "./pages/CompanyView";
import Categories from "./pages/Categories";
import MapManage from "./pages/MapManage";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import CompanyUsers from "./pages/CompanyUsers";
import CompanySettings from "./pages/CompanySettings";
import CompanyDetails from "./pages/CompanyDetails";
import CompanyProducts from "./pages/CompanyProducts";
import MaintenancePage from "./pages/Maintenance";
import Register from "./pages/Register";
import Help from "./pages/Help";
import WarehouseUserProfile from "./pages/CompanyUserProfile";

function MyWarehouseRedirect() {
  const { user } = useAuth();
  if (!user?.companyId) return <Navigate to="/" replace />;
  return <CompanyDetails />;
}

export default function App() {

   useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/maintenance" element={<MaintenancePage to="/maintenance" replace />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          {/* Full company directory: Warehouse admin & users only */}
          <Route path="/my-company" element={<MyWarehouseRedirect />} />
          <Route path="/company/products/:id" element={<ProtectedRoute><CompanyProducts /></ProtectedRoute>} />
          <Route path="/company/:id/edit" element={<ProtectedRoute><CompanyDetails /></ProtectedRoute>} />
          <Route path="/company/:companyId/users/:userId/edit" element={<ProtectedRoute><WarehouseUserProfile /></ProtectedRoute>} />
          <Route path="/company/:id/users" element={<ProtectedRoute><CompanyUsers /></ProtectedRoute>} />
          <Route path="/company/:companyId/users/new" element={<ProtectedRoute><WarehouseUserProfile /></ProtectedRoute>} />


          {/* Full company directory: super admin only */}
          <Route path="/companies" element={<ProtectedRoute roles={["super_admin"]}><Companies /></ProtectedRoute>} />
          <Route path="/companies/new" element={<ProtectedRoute roles={["super_admin"]}><CompanyForm /></ProtectedRoute>} />
          <Route path="/companies/:id" element={<ProtectedRoute roles={["super_admin"]}><CompanyView /></ProtectedRoute>} />

          <Route path="/categories" element={<ProtectedRoute roles={["super_admin"]}><Categories /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute roles={["super_admin"]}><MapManage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={["super_admin"]}><Reports /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={["super_admin"]}><Users /></ProtectedRoute>} />
          <Route path="/users/new" element={<ProtectedRoute roles={["super_admin"]}><UserProfile /></ProtectedRoute>} />
          <Route path="/users/:id/edit" element={<ProtectedRoute roles={["super_admin"]}><UserProfile /></ProtectedRoute>} />
          <Route path="/contact" element={<ProtectedRoute roles={["super_admin"]}><Help /></ProtectedRoute>} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="/company/:id/settings" element={<CompanySettings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
