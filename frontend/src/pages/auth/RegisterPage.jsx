/* Registration page for new customers (CV04.3). */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sprout,
  User,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { authApi } from "../../services/authApi";
import { notifyApiToast } from "../../services/axiosClient";

export default function RegisterPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Nếu người dùng đã đăng nhập thì điều hướng về trang chủ
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Vui lòng nhập họ và tên của bạn.";
    }

    if (!formData.email.trim()) {
      errors.email = "Vui lòng nhập địa chỉ email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Địa chỉ email không đúng định dạng.";
    }

    if (formData.phone && !/^[0-9+]{9,15}$/.test(formData.phone.trim())) {
      errors.phone = "Số điện thoại không hợp lệ (từ 9 đến 15 chữ số).";
    }

    if (!formData.password) {
      errors.password = "Vui lòng nhập mật khẩu.";
    } else if (formData.password.length < 8) {
      errors.password = "Mật khẩu phải có tối thiểu 8 ký tự.";
    }

    if (!formData.password_confirmation) {
      errors.password_confirmation = "Vui lòng xác nhận lại mật khẩu.";
    } else if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = "Mật khẩu xác nhận không trùng khớp.";
    }

    if (!agreeTerms) {
      errors.terms = "Vui lòng đồng ý với Điều khoản sử dụng của XanhFarm.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      const userData = res?.user || res?.data?.user;
      const token = res?.token || res?.data?.token;

      if (token) {
        localStorage.setItem("access_token", token);
      }

      if (userData) {
        login(userData);
      }

      notifyApiToast(
        "success",
        `Đăng ký tài khoản thành công! Chào mừng ${formData.name.trim()} gia nhập XanhFarm.`,
      );

      navigate("/", { replace: true });
    } catch (err) {
      const serverFieldErrors = err?.fieldErrors || err?.response?.data?.errors;
      if (serverFieldErrors && typeof serverFieldErrors === "object") {
        const formatted = {};
        for (const [key, val] of Object.entries(serverFieldErrors)) {
          formatted[key] = Array.isArray(val) ? val[0] : val;
        }
        setFieldErrors(formatted);
      }

      const msg =
        err?.message ||
        err?.response?.data?.message ||
        "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin đã nhập.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#f8faf8]">
      <div className="w-full max-w-lg space-y-8">
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
            Đăng ký tài khoản Khách hàng
          </h1>
          <p className="text-[13px] text-[#5a6357] mt-1">
            Nhận ưu đãi gói rau củ tươi sạch và theo dõi xuất xứ chuẩn VietGAP
          </p>
        </div>

        {/* ================= 2. REGISTER CARD ================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#c0c9bb]/30">
          {/* Thông báo lỗi tổng hợp */}
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
            {/* Họ và tên */}
            <div>
              <label
                htmlFor="name"
                className="block text-[13px] font-bold text-[#191c1b] mb-1.5"
              >
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#f8faf8] focus:bg-white focus:ring-2 outline-none transition-all text-[13.5px] text-[#191c1b] placeholder:text-[#5a6357]/60 ${
                    fieldErrors.name
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-[#c0c9bb]/50 focus:border-[#00450d] focus:ring-[#00450d]/10"
                  }`}
                />
                <User className="w-4 h-4 text-[#5a6357] absolute left-3.5 top-3 pointer-events-none" />
              </div>
              {fieldErrors.name && (
                <p className="mt-1 text-[12px] text-red-600 font-medium">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-bold text-[#191c1b] mb-1.5"
              >
                Địa chỉ Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@gmail.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#f8faf8] focus:bg-white focus:ring-2 outline-none transition-all text-[13.5px] text-[#191c1b] placeholder:text-[#5a6357]/60 ${
                    fieldErrors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-[#c0c9bb]/50 focus:border-[#00450d] focus:ring-[#00450d]/10"
                  }`}
                />
                <Mail className="w-4 h-4 text-[#5a6357] absolute left-3.5 top-3 pointer-events-none" />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-[12px] text-red-600 font-medium">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Số điện thoại */}
            <div>
              <label
                htmlFor="phone"
                className="block text-[13px] font-bold text-[#191c1b] mb-1.5"
              >
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0912 345 678"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#f8faf8] focus:bg-white focus:ring-2 outline-none transition-all text-[13.5px] text-[#191c1b] placeholder:text-[#5a6357]/60 ${
                    fieldErrors.phone
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-[#c0c9bb]/50 focus:border-[#00450d] focus:ring-[#00450d]/10"
                  }`}
                />
                <Phone className="w-4 h-4 text-[#5a6357] absolute left-3.5 top-3 pointer-events-none" />
              </div>
              {fieldErrors.phone && (
                <p className="mt-1 text-[12px] text-red-600 font-medium">
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* Mật khẩu */}
            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-bold text-[#191c1b] mb-1.5"
              >
                Mật khẩu khởi tạo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tối thiểu 8 ký tự"
                  className={`w-full pl-10 pr-11 py-2.5 rounded-xl border bg-[#f8faf8] focus:bg-white focus:ring-2 outline-none transition-all text-[13.5px] text-[#191c1b] placeholder:text-[#5a6357]/60 ${
                    fieldErrors.password
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-[#c0c9bb]/50 focus:border-[#00450d] focus:ring-[#00450d]/10"
                  }`}
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
              {fieldErrors.password && (
                <p className="mt-1 text-[12px] text-red-600 font-medium">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-[13px] font-bold text-[#191c1b] mb-1.5"
              >
                Xác nhận lại mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu phía trên"
                  className={`w-full pl-10 pr-11 py-2.5 rounded-xl border bg-[#f8faf8] focus:bg-white focus:ring-2 outline-none transition-all text-[13.5px] text-[#191c1b] placeholder:text-[#5a6357]/60 ${
                    fieldErrors.password_confirmation
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-[#c0c9bb]/50 focus:border-[#00450d] focus:ring-[#00450d]/10"
                  }`}
                />
                <Lock className="w-4 h-4 text-[#5a6357] absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3.5 top-2.5 p-0.5 text-[#5a6357] hover:text-[#191c1b] transition-colors"
                  aria-label={
                    showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password_confirmation && (
                <p className="mt-1 text-[12px] text-red-600 font-medium">
                  {fieldErrors.password_confirmation}
                </p>
              )}
            </div>

            {/* Điều khoản sử dụng */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (e.target.checked && fieldErrors.terms) {
                      setFieldErrors((prev) => ({ ...prev, terms: null }));
                    }
                  }}
                  className="w-4 h-4 mt-0.5 rounded text-[#00450d] focus:ring-[#00450d] border-[#c0c9bb] cursor-pointer"
                />
                <span className="text-[12.5px] text-[#41493e] leading-relaxed">
                  Tôi đồng ý với{" "}
                  <span className="font-semibold text-[#00450d] hover:underline">
                    Điều khoản dịch vụ
                  </span>{" "}
                  và{" "}
                  <span className="font-semibold text-[#00450d] hover:underline">
                    Chính sách bảo mật
                  </span>{" "}
                  của Hệ thống Nông Sản Sạch XanhFarm.
                </span>
              </label>
              {fieldErrors.terms && (
                <p className="mt-1 text-[12px] text-red-600 font-medium pl-6.5">
                  {fieldErrors.terms}
                </p>
              )}
            </div>

            {/* Nút Đăng ký */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-[#00450d] hover:bg-[#006e1c] disabled:bg-[#00450d]/60 text-white font-bold text-[14px] shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Đang xử lý đăng ký...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn tất đăng ký tài khoản</span>
                </>
              )}
            </button>
          </form>

          {/* ================= 3. SWITCH TO LOGIN ================= */}
          <div className="mt-6 pt-5 border-t border-[#c0c9bb]/30 text-center">
            <p className="text-[13px] text-[#5a6357]">
              Bạn đã có tài khoản XanhFarm?{" "}
              <Link
                to="/login"
                className="font-bold text-[#006e1c] hover:text-[#00450d] transition-colors ml-1"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>

        {/* ================= 4. FOOTER NOTE & RETURN ================= */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-[12px] text-[#5a6357]">
            <ShieldCheck className="w-4 h-4 text-[#006e1c]" />
            <span>Thông tin cá nhân được bảo vệ & mã hóa an toàn</span>
          </div>
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#5a6357] hover:text-[#00450d] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang chủ mua sắm</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
