import { Outlet } from "react-router-dom";
import DesktopNavbar from "./DesktopNavbar";
import BottomNav from "./BottomNav";
import AuthScreen from "./AuthScreen";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();

  return (
    <>
      <DesktopNavbar />
      <div className="content-wrap">
        <Outlet />
      </div>
      <BottomNav />
      {isAuthModalOpen && (
        <AuthScreen isModal onClose={closeAuthModal} />
      )}
    </>
  );
}