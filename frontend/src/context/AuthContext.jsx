/* Provides authentication session state and actions to the application (RBAC - CV04.6). */
import { useEffect, useMemo, useState, useCallback } from "react";
import AuthContext from "./authStateContext";
import { authApi } from "../services/authApi";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    // Nếu có token lưu trữ thì cần kiểm tra phiên ban đầu
    return Boolean(localStorage.getItem("access_token"));
  });

  // Xác thực token và đồng bộ thông tin phiên làm việc từ server khi khởi chạy ứng dụng
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return;
    }

    authApi
      .me()
      .then((res) => {
        const userData = res?.data?.user;
        if (userData) {
          const permissions = res?.data?.permissions || [];
          const updatedUser = {
            ...userData,
            permissions,
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      })
      .catch((err) => {
        // Nếu token không hợp lệ (401) hoặc tài khoản bị khóa (403), xóa session
        if (err.status === 401 || err.status === 403) {
          setUser(null);
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback((userData, token = null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    }
    if (token) {
      localStorage.setItem("access_token", token);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Lỗi khi gọi API logout:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
    }
  }, []);

  // Kiểm tra vai trò của người dùng
  const hasRole = useCallback(
    (roleOrRoles) => {
      if (!user) return false;
      const userRole = user.role || (Array.isArray(user.roles) ? user.roles[0] : null);
      if (!userRole) return false;

      if (Array.isArray(roleOrRoles)) {
        return roleOrRoles.includes(userRole);
      }
      return userRole === roleOrRoles;
    },
    [user],
  );

  // Kiểm tra quyền hạn cụ thể
  const hasPermission = useCallback(
    (permission) => {
      if (!user || !Array.isArray(user.permissions)) return false;
      return user.permissions.includes(permission);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      setUser,
      hasRole,
      hasPermission,
      isCustomer: user?.role === "customer",
      isFarmStaff: user?.role === "farm_staff",
      isSales: user?.role === "sales",
      isAdmin: user?.role === "admin",
    }),
    [user, isLoading, login, logout, hasRole, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
