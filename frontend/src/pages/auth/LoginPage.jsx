/* Login page with role-based routing and secure session handling (CV04.4). */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { authApi } from "../../services/authApi";
import { notifyApiToast } from "../../services/axiosClient";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Điều hướng tự động nếu đã có phiên đăng nhập
  useEffect(() => {
    if (!user) return;
    if (user.role === "farm_staff") {
      navigate("/farm/seasons", { replace: true });
    } else if (user.role === "sales") {
      navigate("/sales/orders", { replace: true });
    } else if (user.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.login({
        email: email.trim(),
        password,
        remember,
      });

      const userData = res?.user || res?.data?.user;
      const token = res?.token || res?.data?.token;

      if (!userData) {
        throw new Error("Không nhận được dữ liệu người dùng từ máy chủ.");
      }

      if (token) {
        localStorage.setItem("access_token", token);
      }

      // Lưu trạng thái phiên vào AuthContext & localStorage
      login(userData);
      notifyApiToast("success", `Chào mừng ${userData.name || "bạn"} trở lại!`);

      // Điều hướng phân luồng theo vai trò người dùng (CV04.4)
      const role = userData.role;
      if (role === "farm_staff") {
        navigate("/farm/seasons", { replace: true });
      } else if (role === "sales") {
        navigate("/sales/orders", { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg =
        err?.fieldErrors?.email?.[0] ||
        err?.message ||
        "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#f8faf8]">
      <div className="w-full max-w-md space-y-8">
        {/* ================= 1. BRAND HEADER ================= */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 group focus:outline-none mb-3"
            aria-label="Về trang chủ XanhFarm"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#00450d] text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <Sprout className="w-6 h-6 text-[#86efac]" />
            </div>
            <div className="text-left leading-none">
              <span className="font-extrabold text-[22px] tracking-tight text-[#00450d] block">
                XanhFarm
              </span>
              <span className="text-[10px] font-bold tracking-wider text-[#006e1c] uppercase mt-0.5 block">
                Nông sản hữu cơ sạch
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#191c1b] mt-2">
            Đăng nhập hệ thống
          </h1>
          <p className="text-[13px] text-[#5a6357] mt-1">
            Truy cập cổng mua sắm hoặc không gian làm việc chuyên nghiệp
          </p>
        </div>

        {/* ================= 2. LOGIN CARD ================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#c0c9bb]/30">
          {/* Thông báo lỗi */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-[13px] flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-bold text-[#191c1b] mb-1.5"
              >
                Email đăng nhập <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nongsansach.vn"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#c0c9bb]/50 bg-[#f8faf8] focus:bg-white focus:border-[#00450d] focus:ring-2 focus:ring-[#00450d]/10 outline-none transition-all text-[13.5px] text-[#191c1b] placeholder:text-[#5a6357]/60"
                />
                <Mail className="w-4 h-4 text-[#5a6357] absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-[13px] font-bold text-[#191c1b]"
                >
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] font-semibold text-[#006e1c] hover:text-[#00450d] transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-[#c0c9bb]/50 bg-[#f8faf8] focus:bg-white focus:border-[#00450d] focus:ring-2 focus:ring-[#00450d]/10 outline-none transition-all text-[13.5px] text-[#191c1b] placeholder:text-[#5a6357]/60"
                />
                <Lock className="w-4 h-4 text-[#5a6357] absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-2.5 p-0.5 text-[#5a6357] hover:text-[#191c1b] transition-colors"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00450d] focus:ring-[#00450d] border-[#c0c9bb] cursor-pointer"
                />
                <span className="text-[13px] text-[#41493e] font-medium">
                  Ghi nhớ đăng nhập
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#00450d] hover:bg-[#006e1c] disabled:bg-[#00450d]/60 text-white font-bold text-[14px] shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>
          </form>

          {/* Security Assurance Badge */}
          <div className="mt-6 pt-5 border-t border-[#c0c9bb]/20 flex items-center justify-center gap-2 text-[11.5px] text-[#5a6357]">
            <ShieldCheck className="w-4 h-4 text-[#006e1c]" />
            <span>Bảo mật phiên làm việc qua Sanctum Token & RBAC</span>
          </div>
        </div>

        {/* ================= 3. FOOTER PROMPTS ================= */}
        <div className="text-center space-y-3">
          <p className="text-[13px] text-[#41493e]">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="font-bold text-[#00450d] hover:text-[#006e1c] hover:underline transition-colors"
            >
              Đăng ký tài khoản ngay
            </Link>
          </p>

          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#5a6357] hover:text-[#00450d] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang chủ XanhFarm</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
