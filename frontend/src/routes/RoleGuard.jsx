/* Restricts nested routes to users with one of the allowed roles. */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function RoleGuard({ roles = [] }) {
  const { user } = useAuth();
  const userRoles = user?.roles ?? (user?.role ? [user.role] : []);
  const hasAllowedRole = roles.some((role) => userRoles.includes(role));

  return hasAllowedRole ? <Outlet /> : <Navigate to="/" replace />;
}
