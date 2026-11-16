/* Password recovery and reset page using Mailpit email delivery (CV04.5). */
import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { authApi } from "../../services/authApi";
import { notifyApiToast } from "../../services/axiosClient";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();

  // Kiểm tra token từ URL route param hoặc query param
  const initialToken = routeToken || searchParams.get("token") || "";
  const initialEmail = searchParams.get("email") || "";

  // mode: "request" (gửi email khôi phục) hoặc "reset" (nhập mật khẩu mới với token)
  const [mode, setMode] = useState(() => (initialToken ? "reset" : "request"));

  // State cho mode "request"
  const [requestEmail, setRequestEmail] = useState(initialEmail);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState("");
  const [requestErrorMessage, setRequestErrorMessage] = useState("");

  // State cho mode "reset"
  const [resetData, setResetData] = useState({
    token: initialToken,
    email: initialEmail,
    password: "",
    password_confirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");
  const [resetErrorMessage, setResetErrorMessage] = useState("");
  const [resetFieldErrors, setResetFieldErrors] = useState({});


  // Xử lý gửi yêu cầu khôi phục email
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setRequestErrorMessage("");
    setRequestSuccessMessage("");

    if (!requestEmail.trim()) {
      setRequestErrorMessage("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestEmail.trim())) {
      setRequestErrorMessage("Địa chỉ email không đúng định dạng.");
      return;
    }

    setIsRequestLoading(true);

    try {
      const res = await authApi.requestPasswordReset({
        email: requestEmail.trim().toLowerCase(),
      });

      const successMsg =
        res?.message ||
        "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn! Vui lòng kiểm tra hòm thư Mailpit.";
      setRequestSuccessMessage(successMsg);
      notifyApiToast("success", successMsg);

      // Điền sẵn email cho form reset nếu người dùng chuyển mode thủ công
      setResetData((prev) => ({
        ...prev,
        email: requestEmail.trim().toLowerCase(),
      }));
    } catch (err) {
      const msg =
        err?.fieldErrors?.email?.[0] ||
        err?.message ||
        "Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra lại email.";
      setRequestErrorMessage(msg);
    } finally {
      setIsRequestLoading(false);
    }
  };

  // Xử lý đặt lại mật khẩu mới
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetErrorMessage("");
    setResetSuccessMessage("");
    setResetFieldErrors({});

    const errors = {};
    if (!resetData.token.trim()) {
      errors.token = "Mã xác thực token là bắt buộc.";
    }
    if (!resetData.email.trim()) {
      errors.email = "Vui lòng nhập địa chỉ email.";
    }
    if (!resetData.password) {
      errors.password = "Vui lòng nhập mật khẩu mới.";
    } else if (resetData.password.length < 8) {
      errors.password = "Mật khẩu mới phải có tối thiểu 8 ký tự.";
    }
    if (!resetData.password_confirmation) {
      errors.password_confirmation = "Vui lòng xác nhận mật khẩu mới.";
    } else if (resetData.password !== resetData.password_confirmation) {
      errors.password_confirmation = "Xác nhận mật khẩu không trùng khớp.";
    }

    if (Object.keys(errors).length > 0) {
      setResetFieldErrors(errors);
      return;
    }

    setIsResetLoading(true);

    try {
      const res = await authApi.resetPassword({
        token: resetData.token.trim(),
        email: resetData.email.trim().toLowerCase(),
        password: resetData.password,
        password_confirmation: resetData.password_confirmation,
      });

      const successMsg =
        res?.message ||
        "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.";
      setResetSuccessMessage(successMsg);
      notifyApiToast("success", successMsg);

      // Tự động chuyển hướng về trang đăng nhập sau 2.5 giây
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2500);
    } catch (err) {
      const serverFieldErrors = err?.fieldErrors || err?.response?.data?.errors;
      if (serverFieldErrors && typeof serverFieldErrors === "object") {
        const formatted = {};
        for (const [key, val] of Object.entries(serverFieldErrors)) {
          formatted[key] = Array.isArray(val) ? val[0] : val;
        }
        setResetFieldErrors(formatted);
      }

      const msg =
        err?.fieldErrors?.email?.[0] ||
        err?.fieldErrors?.token?.[0] ||
        err?.message ||
        "Không thể đặt lại mật khẩu. Token có thể đã hết hạn hoặc không hợp lệ.";
      setResetErrorMessage(msg);
    } finally {
      setIsResetLoading(false);
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
            {mode === "request" ? "Quên mật khẩu?" : "Thiết lập mật khẩu mới"}
          </h1>
          <p className="text-[13px] text-[#5a6357] mt-1">
            {mode === "request"
              ? "Nhập email đăng ký để nhận liên kết khôi phục bảo mật qua Mailpit"
              : "Nhập mã xác thực đã nhận trong hòm thư Mailpit để đổi mật khẩu"}
          </p>
        </div>

        {/* ================= 2. MAIN CARD ================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#c0c9bb]/30">
          {/* TAB CHUYỂN ĐỔI CHẾ ĐỘ */}
          <div className="flex rounded-xl bg-[#f2f4f2] p-1 mb-6 border border-[#c0c9bb]/40">
            <button
              type="button"
              onClick={() => {
                setMode("request");
                setRequestErrorMessage("");
              }}
              className={`flex-1 py-2 text-[12.5px] font-bold rounded-lg transition-all cursor-pointer ${
                mode === "request"
                  ? "bg-white text-[#00450d] shadow-2xs"
                  : "text-[#5a6357] hover:text-[#191c1b]"
              }`}
            >
              1. Gửi liên kết email
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setResetErrorMessage("");
              }}
              className={`flex-1 py-2 text-[12.5px] font-bold rounded-lg transition-all cursor-pointer ${
                mode === "reset"
                  ? "bg-white text-[#00450d] shadow-2xs"
                  : "text-[#5a6357] hover:text-[#191c1b]"
              }`}
            >
              2. Đặt lại mật khẩu
            </button>
          </div>

          {/* ================= KHỐI 1: GỬI LIÊN KẾT EMAIL ================= */}
          {mode === "request" && (
            <div className="space-y-4">
              {/* Thông báo lỗi */}
              {requestErrorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-[13px] flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">
                    {requestErrorMessage}
                  </div>
                </div>
              )}

              {/* Thông báo thành công */}
              {requestSuccessMessage && (
                <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-900 text-[13px] space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1 font-medium leading-relaxed">
                      {requestSuccessMessage}
                    </div>
                  </div>

                  {/* Nút truy cập Mailpit trực tiếp */}
                  <div className="pt-1">
                    <a
                      href="http://127.0.0.1:8025"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-[12px] font-bold transition-all shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mở hòm thư Mailpit (Cổng 8025)</span>
                    </a>
                  </div>
                </div>
              )}

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="request-email"
                    className="block text-[13px] font-bold text-[#191c1b] mb-1.5"
                  >
                    Địa chỉ Email của bạn <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="request-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      placeholder="name@nongsansach.vn"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#c0c9bb]/50 bg-[#f8faf8] focus:bg-white focus:border-[#00450d] focus:ring-2 focus:ring-[#00450d]/10 outline-none transition-all text-[13.5px] text-[#191c1b] placeholder:text-[#5a6357]/60"
                    />
                    <Mail className="w-4 h-4 text-[#5a6357] absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRequestLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-[#00450d] hover:bg-[#006e1c] disabled:bg-[#00450d]/60 text-white font-bold text-[14px] shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isRequestLoading ? (
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
                      <span>Đang gửi liên kết khôi phục...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Gửi liên kết khôi phục mật khẩu</span>
                    </>
                  )}
                </button>
              </form>

              {requestSuccessMessage && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-[13px] font-bold text-[#006e1c] hover:text-[#00450d] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Tiếp tục: Nhập token và đặt lại mật khẩu</span>
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= KHỐI 2: ĐẶT LẠI MẬT KHẨU MỚI ================= */}
          {mode === "reset" && (
            <div className="space-y-4">
              {/* Thông báo lỗi */}
              {resetErrorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-[13px] flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">
                    {resetErrorMessage}
                  </div>
                </div>
              )}

              {/* Thông báo thành công */}
              {resetSuccessMessage && (
                <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-900 text-[13px] space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1 font-medium leading-relaxed">
                      {resetSuccessMessage}
                    </div>
                  </div>
                  <p className="text-[12px] text-green-700 pl-6.5">
                    Hệ thống sẽ tự động chuyển về trang Đăng nhập trong giây lát...
                  </p>
                </div>
              )}

              <form onSubmit={handleResetSubmit} className="space-y-3.5">
                {/* Mã xác thực Token */}
                <div>
                  <label
                    htmlFor="reset-token"
                    className="block text-[13px] font-bold text-[#191c1b] mb-1.5"
                  >
                    Mã xác thực (Token) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reset-token"
                      name="token"
                      type="text"
                      required
                      value={resetData.token}
                      onChange={(e) =>
                        setResetData((prev) => ({ ...prev, token: e.target.value }))
                      }
                      placeholder="Dán mã token từ email Mailpit..."
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#f8faf8] focus:bg-white focus:ring-2 outline-none transition-all text-[13.5px] text-[#191c1b] placeholder:text-[#5a6357]/60 font-mono text-[12.5px] ${
                        resetFieldErrors.token
                          ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                          : "border-[#c0c9bb]/50 focus:border-[#00450d] focus:ring-[#00450d]/10"
                      }`}
                    />
                    <KeyRound className="w-4 h-4 text-[#5a6357] absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                  {resetFieldErrors.token && (
                    <p className="mt-1 text-[12px] text-red-600 font-medium">
                      {resetFieldErrors.token}
                    </p>
                  )}
                </div>

                {/* Email xác nhận */}
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-[13px] font-bold text-[#191c1b] mb-1.5"
                  >
                    Email tài khoản <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reset-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={resetData.email}
                      onChange={(e) =>
                        setResetData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="name@nongsansach.vn"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#f8faf8] focus:bg-white focus:ring-2 outline-none transition-all text-[13.5px] text-[#191c1b] placeholder:text-[#5a6357]/60 ${
                        resetFieldErrors.email
                          ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                          : "border-[#c0c9bb]/50 focus:border-[#00450d] focus:ring-[#00450d]/10"
                      }`}
                    />
                    <Mail className="w-4 h-4 text-[#5a6357] absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                  {resetFieldErrors.email && (
                    <p className="mt-1 text-[12px] text-red-600 font-medium">
                      {resetFieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-[13px] font-bold text-[#191c1b] mb-1.5"
                  >
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={resetData.password}
                      onChange={(e) =>
                        setResetData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Tối thiểu 8 ký tự"
                      className={`w-full pl-10 pr-11 py-2.5 rounded-xl border bg-[#f8faf8] focus:bg-white focus:ring-2 outline-none transition-all text-[13.5px] text-[#191c1b] placeholder:text-[#5a6357]/60 ${
                        resetFieldErrors.password
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
                  {resetFieldErrors.password && (
                    <p className="mt-1 text-[12px] text-red-600 font-medium">
                      {resetFieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div>
                  <label
                    htmlFor="new-password-confirmation"
                    className="block text-[13px] font-bold text-[#191c1b] mb-1.5"
                  >
                    Xác nhận lại mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="new-password-confirmation"
                      name="password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={resetData.password_confirmation}
                      onChange={(e) =>
                        setResetData((prev) => ({
                          ...prev,
                          password_confirmation: e.target.value,
                        }))
                      }
                      placeholder="Nhập lại mật khẩu mới"
                      className={`w-full pl-10 pr-11 py-2.5 rounded-xl border bg-[#f8faf8] focus:bg-white focus:ring-2 outline-none transition-all text-[13.5px] text-[#191c1b] placeholder:text-[#5a6357]/60 ${
                        resetFieldErrors.password_confirmation
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
                        showConfirmPassword
                          ? "Ẩn mật khẩu xác nhận"
                          : "Hiện mật khẩu xác nhận"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {resetFieldErrors.password_confirmation && (
                    <p className="mt-1 text-[12px] text-red-600 font-medium">
                      {resetFieldErrors.password_confirmation}
                    </p>
                  )}
                </div>

                {/* Nút Đặt lại mật khẩu */}
                <button
                  type="submit"
                  disabled={isResetLoading}
                  className="w-full mt-3 py-3 px-4 rounded-xl bg-[#00450d] hover:bg-[#006e1c] disabled:bg-[#00450d]/60 text-white font-bold text-[14px] shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isResetLoading ? (
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
                      <span>Đang cập nhật mật khẩu...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Xác nhận đổi mật khẩu mới</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ================= 3. SWITCH TO LOGIN ================= */}
          <div className="mt-6 pt-5 border-t border-[#c0c9bb]/30 text-center">
            <p className="text-[13px] text-[#5a6357]">
              Bạn đã nhớ mật khẩu?{" "}
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
            <span>Mã hóa bảo vệ mật khẩu tiêu chuẩn Argon2id / Bcrypt</span>
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
