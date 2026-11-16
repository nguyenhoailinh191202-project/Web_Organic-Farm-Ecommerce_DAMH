/* Login and role-based redirect page (CV04.4). */
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authApi } from "../../services/authApi";
import { useAuth } from "../../context/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const validateClient = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = "Vui lòng nhập địa chỉ email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Địa chỉ email không đúng định dạng.";
    }

    if (!formData.password) {
      errs.password = "Vui lòng nhập mật khẩu.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (generalError) setGeneralError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMsg("");

    if (!validateClient()) return;

    setLoading(true);
    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        remember: formData.remember,
      };

      const res = await authApi.login(payload);
      const resData = res?.data || res || {};
      const user = resData.user || null;
      const token = resData.token || null;
      const backendRedirect = resData.redirect_url || "/";

      if (user) {
        login(user, token);
        setSuccessMsg(`✓ Chào mừng ${user.name}! Đang chuyển hướng...`);

        // Điều hướng phân luồng tự động theo vai trò:
        setTimeout(() => {
          const fromLocation = location.state?.from?.pathname;
          if (fromLocation && user.role === "customer") {
            navigate(fromLocation, { replace: true });
          } else {
            navigate(backendRedirect, { replace: true });
          }
        }, 500);
      }
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      }
      setGeneralError(err.message || "Email hoặc mật khẩu không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-10 px-4 sm:px-6">
      {/* Breadcrumb Navigation */}
      <div className="max-w-md w-full mx-auto mb-4 flex items-center gap-2 text-[12.5px] text-on-surface-variant font-medium">
        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">home</span>
          <span>Trang Chủ</span>
        </Link>
        <span>/</span>
        <span className="text-primary font-bold">Đăng Nhập</span>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden animate-scale">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-6 sm:p-7 text-on-primary relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-[26px]">lock_person</span>
            </div>
            <div>
              <h1 className="font-headline-sm text-[20px] sm:text-[22px] font-extrabold tracking-tight">
                Đăng Nhập XanhFarm
              </h1>
              <p className="text-[12px] text-on-primary/80 mt-0.5">
                Mua sắm nông sản hoặc truy cập cổng điều hành nội bộ
              </p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* General Error Banner */}
            {generalError && (
              <div className="p-3.5 rounded-2xl bg-error-container text-on-error-container text-[12.5px] font-semibold flex items-center gap-2.5 animate-fadeIn">
                <span className="material-symbols-outlined text-[20px] shrink-0 text-error">
                  error
                </span>
                <span>{generalError}</span>
              </div>
            )}

            {/* Success Message Banner */}
            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-secondary-fixed text-on-secondary-fixed text-[12.5px] font-bold flex items-center gap-2.5 animate-fadeIn">
                <span className="material-symbols-outlined text-[20px] shrink-0 text-secondary">
                  check_circle
                </span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. Email Input */}
            <div>
              <label htmlFor="login-email" className="block text-[12.5px] font-bold text-on-surface mb-1">
                Địa chỉ Email <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-outline pointer-events-none">
                  mail
                </span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@domain.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-[13px] bg-surface-container-lowest text-on-surface transition-all focus:outline-none focus:ring-2 ${
                    fieldErrors.email
                      ? "border-error focus:ring-error/20"
                      : "border-outline-variant/40 focus:border-secondary focus:ring-secondary/20"
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-[11px] text-error font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* 2. Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="text-[12.5px] font-bold text-on-surface">
                  Mật khẩu đăng nhập <span className="text-error">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11.5px] font-bold text-secondary hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-outline pointer-events-none">
                  lock
                </span>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu tài khoản"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-[13px] bg-surface-container-lowest text-on-surface transition-all focus:outline-none focus:ring-2 ${
                    fieldErrors.password
                      ? "border-error focus:ring-error/20"
                      : "border-outline-variant/40 focus:border-secondary focus:ring-secondary/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary p-0.5 cursor-pointer"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-[11px] text-error font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* 3. Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-primary focus:ring-secondary/40 border-outline-variant/60 accent-[#00450d]"
                />
                <span className="text-[12px] text-on-surface-variant font-medium">
                  Ghi nhớ đăng nhập
                </span>
              </label>
            </div>

            {/* 4. Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-[14px] hover:bg-primary-container shadow-md transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực thông tin...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[19px]">login</span>
                  <span>Đăng Nhập</span>
                </>
              )}
            </button>

            {/* 5. Switch to Register */}
            <div className="pt-2 text-center text-[13px] text-on-surface-variant">
              <span>Chưa có tài khoản khách hàng? </span>
              <Link to="/register" className="font-bold text-primary hover:text-secondary transition-colors underline">
                Đăng ký ngay
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
