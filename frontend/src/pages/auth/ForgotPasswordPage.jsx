/* Forgot and reset password page (CV04.5). */
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../services/authApi";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Kiểm tra nếu đường dẫn có query params ?token=...&email=...
  const initialToken = searchParams.get("token") || "";
  const initialEmail = searchParams.get("email") || "";

  const [step, setStep] = useState(initialToken ? 2 : 1); // 1: Gửi yêu cầu email, 2: Nhập mã OTP & Đặt mật khẩu mới
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [devOtp, setDevOtp] = useState(""); // Lưu OTP trong môi trường local/dev để người dùng test thuận tiện
  const [countdown, setCountdown] = useState(0);

  // Hiệu ứng đếm ngược chuyển hướng khi đổi mật khẩu thành công
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && successMsg && step === 2) {
      navigate("/login");
    }
  }, [countdown, successMsg, step, navigate]);

  // Đánh giá độ mạnh mật khẩu
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, text: "Yếu", color: "bg-error text-error" };
    if (score === 2 || score === 3) return { score: 2, text: "Trung bình", color: "bg-amber-500 text-amber-600" };
    return { score: 3, text: "Mạnh an toàn", color: "bg-emerald-600 text-emerald-700" };
  };

  const strength = getPasswordStrength(password);

  // Xử lý gửi yêu cầu nhận mã OTP / Token
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setFieldErrors({});

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldErrors({ email: "Vui lòng nhập địa chỉ email tài khoản." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFieldErrors({ email: "Địa chỉ email không đúng định dạng." });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.requestPasswordReset({ email: trimmedEmail });
      const otpFromResponse = res?.data?.otp || "";
      if (otpFromResponse) {
        setDevOtp(otpFromResponse);
      }
      setSuccessMsg(
        res?.message || "Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư."
      );
      setStep(2);
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      } else {
        setGeneralError(err.message || "Không thể gửi mã xác nhận. Vui lòng kiểm tra lại email.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đặt lại mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setFieldErrors({});

    const errs = {};
    if (!email.trim()) errs.email = "Thiếu thông tin email tài khoản.";
    if (!token.trim()) errs.token = "Vui lòng nhập mã xác thực OTP.";
    if (!password) {
      errs.password = "Vui lòng nhập mật khẩu mới.";
    } else if (password.length < 8) {
      errs.password = "Mật khẩu phải chứa ít nhất 8 ký tự.";
    }
    if (!passwordConfirmation) {
      errs.password_confirmation = "Vui lòng xác nhận lại mật khẩu mới.";
    } else if (password !== passwordConfirmation) {
      errs.password_confirmation = "Mật khẩu xác nhận không trùng khớp.";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({
        email: email.trim(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccessMsg(
        res?.message || "Đặt lại mật khẩu thành công! Đang chuyển hướng về trang đăng nhập..."
      );
      setCountdown(3);
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      } else {
        setGeneralError(err.message || "Không thể đặt lại mật khẩu. Vui lòng kiểm tra mã xác thực.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 bg-surface-container-lowest/50">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xl overflow-hidden transition-all duration-300">
        
        {/* Brand Banner Header */}
        <div className="bg-primary/5 px-6 pt-7 pb-5 border-b border-outline-variant/20 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-on-primary shadow-sm mb-3">
            <span className="material-symbols-outlined text-[24px]">
              {step === 1 ? "lock_reset" : "password"}
            </span>
          </div>
          <span className="inline-block px-3 py-1 mb-2 text-[11px] font-bold tracking-wider uppercase rounded-full bg-secondary-container text-on-secondary-container">
            {step === 1 ? "Bước 1 / 2: Gửi Yêu Cầu" : "Bước 2 / 2: Đặt Mật Khẩu"}
          </span>
          <h1 className="text-[20px] font-extrabold text-on-surface tracking-tight">
            {step === 1 ? "Quên Mật Khẩu" : "Thiết Lập Mật Khẩu Mới"}
          </h1>
          <p className="mt-1 text-[12.5px] text-on-surface-variant max-w-xs mx-auto leading-relaxed">
            {step === 1
              ? "Nhập email đăng ký của bạn để nhận mã xác thực OTP 6 số khôi phục tài khoản."
              : `Nhập mã xác thực gửi đến ${email} và mật khẩu mới an toàn.`}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* General Server Error Banner */}
          {generalError && (
            <div className="p-3.5 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-[12.5px] flex items-start gap-2.5 animate-fadeIn">
              <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">
                error
              </span>
              <div className="leading-snug">{generalError}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[12.5px] flex items-start gap-2.5 animate-fadeIn">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                check_circle
              </span>
              <div className="leading-snug">
                <p className="font-bold">{successMsg}</p>
                {countdown > 0 && (
                  <p className="text-[11.5px] text-on-surface-variant mt-1">
                    Tự động chuyển về trang Đăng nhập sau <strong>{countdown}</strong> giây...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Development Quick Test Hint (when devOtp is returned) */}
          {devOtp && step === 2 && !successMsg && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[12px] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-amber-600">info</span>
                <span>Mã thử nghiệm: <strong>{devOtp}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setToken(devOtp)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition-colors cursor-pointer"
              >
                Tự động điền
              </button>
            </div>
          )}

          {/* STEP 1: Gửi yêu cầu qua Email */}
          {step === 1 && (
            <form onSubmit={handleRequestReset} className="space-y-4" noValidate>
              <div>
                <label htmlFor="reset-email" className="block text-[12.5px] font-bold text-on-surface mb-1.5">
                  Email tài khoản <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-outline pointer-events-none">
                    mail
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({});
                      if (generalError) setGeneralError("");
                    }}
                    placeholder="ví_dụ: customer@nongsan.vn"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-[13px] bg-surface-container-lowest text-on-surface transition-all focus:outline-none focus:ring-2 ${
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-[14px] hover:bg-primary-container shadow-md transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang gửi mã xác thực...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[19px]">send</span>
                    <span>Gửi Mã Xác Thực OTP</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-[13px] text-on-surface-variant">
                <span>Bạn đã nhớ lại mật khẩu? </span>
                <Link to="/login" className="font-bold text-primary hover:text-secondary underline">
                  Đăng nhập ngay
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: Nhập OTP và Mật khẩu mới */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
              {/* Email (Readonly hoặc cho phép sửa) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12.5px] font-bold text-on-surface">Email tài khoản</label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setSuccessMsg("");
                      setGeneralError("");
                    }}
                    className="text-[11.5px] font-bold text-secondary hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Đổi email
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-outline pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/30 text-[13px] bg-surface-container/50 text-on-surface-variant font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Mã OTP xác thực */}
              <div>
                <label htmlFor="reset-token" className="block text-[12.5px] font-bold text-on-surface mb-1.5">
                  Mã xác thực OTP (6 số) <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-outline pointer-events-none">
                    pin
                  </span>
                  <input
                    id="reset-token"
                    type="text"
                    required
                    maxLength={10}
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      if (fieldErrors.token) {
                        setFieldErrors((prev) => ({ ...prev, token: null }));
                      }
                    }}
                    placeholder="Nhập mã OTP 6 số"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-[13px] tracking-widest font-mono bg-surface-container-lowest text-on-surface transition-all focus:outline-none focus:ring-2 ${
                      fieldErrors.token
                        ? "border-error focus:ring-error/20"
                        : "border-outline-variant/40 focus:border-secondary focus:ring-secondary/20"
                    }`}
                  />
                </div>
                {fieldErrors.token && (
                  <p className="mt-1 text-[11px] text-error font-medium">{fieldErrors.token}</p>
                )}
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label htmlFor="new-password" className="block text-[12.5px] font-bold text-on-surface mb-1.5">
                  Mật khẩu mới <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-outline pointer-events-none">
                    lock
                  </span>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: null }));
                      }
                    }}
                    placeholder="Tối thiểu 8 ký tự"
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
                {/* Password strength meter */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1.5 h-1.5">
                      <div className={`flex-1 rounded-full ${strength.score >= 1 ? strength.color : "bg-outline-variant/30"}`} />
                      <div className={`flex-1 rounded-full ${strength.score >= 2 ? strength.color : "bg-outline-variant/30"}`} />
                      <div className={`flex-1 rounded-full ${strength.score >= 3 ? strength.color : "bg-outline-variant/30"}`} />
                    </div>
                    <p className={`text-[11px] font-semibold ${strength.color.split(" ")[1]}`}>
                      Độ an toàn: {strength.text}
                    </p>
                  </div>
                )}
                {fieldErrors.password && (
                  <p className="mt-1 text-[11px] text-error font-medium">{fieldErrors.password}</p>
                )}
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label htmlFor="confirm-password" className="block text-[12.5px] font-bold text-on-surface mb-1.5">
                  Xác nhận mật khẩu mới <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-outline pointer-events-none">
                    lock_reset
                  </span>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={passwordConfirmation}
                    onChange={(e) => {
                      setPasswordConfirmation(e.target.value);
                      if (fieldErrors.password_confirmation) {
                        setFieldErrors((prev) => ({ ...prev, password_confirmation: null }));
                      }
                    }}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-[13px] bg-surface-container-lowest text-on-surface transition-all focus:outline-none focus:ring-2 ${
                      fieldErrors.password_confirmation
                        ? "border-error focus:ring-error/20"
                        : "border-outline-variant/40 focus:border-secondary focus:ring-secondary/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary p-0.5 cursor-pointer"
                    aria-label={showConfirmPassword ? "Ẩn xác nhận" : "Hiện xác nhận"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {fieldErrors.password_confirmation && (
                  <p className="mt-1 text-[11px] text-error font-medium">{fieldErrors.password_confirmation}</p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setSuccessMsg("");
                  }}
                  className="py-3 px-4 rounded-xl border border-outline-variant/40 font-bold text-[13px] text-on-surface hover:bg-surface-container transition-all cursor-pointer"
                >
                  Quay Lại
                </button>
                <button
                  type="submit"
                  disabled={loading || Boolean(successMsg)}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary text-on-primary font-bold text-[14px] hover:bg-primary-container shadow-md transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[19px]">check</span>
                      <span>Cập Nhật Mật Khẩu</span>
                    </>
                  )}
                </button>
              </div>

              {/* Link về đăng nhập */}
              <div className="pt-2 text-center text-[13px] text-on-surface-variant">
                <Link to="/login" className="font-bold text-primary hover:text-secondary underline">
                  Quay lại trang Đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Card Footer Trust Badges */}
        <div className="bg-surface-container-low px-6 py-3.5 border-t border-outline-variant/20 flex flex-wrap items-center justify-around gap-2 text-[11px] font-semibold text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-primary">verified_user</span>
            Mã OTP 6 số bảo mật
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-secondary">timer</span>
            Hiệu lực 60 phút
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-primary">encrypted</span>
            Bcrypt an toàn
          </span>
        </div>
      </div>
    </div>
  );
}
