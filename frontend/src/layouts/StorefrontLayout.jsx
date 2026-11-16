/* Shared storefront frame strictly for guests and customers.
 * Farm staff, sales, and admin are strictly isolated to their management dashboards.
 */
import { Navigate, Outlet } from "react-router-dom";
import StorefrontFooter from "../components/navigation/StorefrontFooter";
import StorefrontHeader from "../components/navigation/StorefrontHeader";
import { useAuth } from "../context/useAuth";

export default function StorefrontLayout() {
  const { user } = useAuth();

  // Kỹ sư canh tác, Sale, Admin tuyệt đối không truy cập trang của khách hàng
  if (user && ["farm_staff", "sales", "admin"].includes(user?.role)) {
    const targetDashboard =
      user.role === "farm_staff"
        ? "/farm/seasons"
        : user.role === "sales"
        ? "/sales/orders"
        : "/admin";
    return <Navigate to={targetDashboard} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] text-[#191c1b] selection:bg-[#91f78e] selection:text-[#00450d]">
      <StorefrontHeader />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <StorefrontFooter />
    </div>
  );
}
