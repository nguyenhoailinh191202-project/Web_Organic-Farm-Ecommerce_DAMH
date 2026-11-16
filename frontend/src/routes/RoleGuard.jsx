/* Restricts nested routes to users with one of the allowed roles (RBAC - CV04.6). */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function RoleGuard({ roles = [] }) {
  const { user } = useAuth();

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
    ? [user.role]
    : [];

  const hasAllowedRole =
    roles.length === 0 || roles.some((role) => userRoles.includes(role));

  if (!hasAllowedRole) {
    // Điều hướng dự phòng an toàn theo vai trò thực tế của người dùng
    const fallbackPath = matchRoleFallback(user?.role);
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}

function matchRoleFallback(role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "sales":
      return "/sales/orders";
    case "farm_staff":
      return "/farm/seasons";
    case "customer":
    default:
      return "/";
  }
}
