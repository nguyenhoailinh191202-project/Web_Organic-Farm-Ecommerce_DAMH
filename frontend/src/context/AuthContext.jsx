/* Provides authentication session state and actions to the application. */
import { useMemo, useState } from "react";
import AuthContext from "./authStateContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading] = useState(false);

  const login = (userData) => {
    setUser(userData);
    try {
      if (userData) {
        localStorage.setItem("auth_user", JSON.stringify(userData));
      } else {
        localStorage.removeItem("auth_user");
      }
    } catch {
      // ignore
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("access_token");
    } catch {
      // ignore
    }
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
