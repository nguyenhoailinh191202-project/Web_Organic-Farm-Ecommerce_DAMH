/* Redirects unauthenticated users or locked accounts to the login page (CV04.6). */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[13px] text-on-surface-variant font-medium">
          Đang xác thực phiên làm việc...
        </p>
      </div>
    );
  }

  // Chặn người dùng chưa đăng nhập hoặc tài khoản đang bị khóa
  if (!user || user.status === "Khoa") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
