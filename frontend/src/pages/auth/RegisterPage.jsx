/* Registration page for new customers (CV04.3). */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../services/authApi";
import { useAuth } from "../../context/useAuth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const validateClient = () => {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = "Vui lòng nhập họ và tên của bạn.";
    } else if (formData.name.trim().length < 2) {
      errs.name = "Họ và tên tối thiểu 2 ký tự.";
    }

    if (!formData.email.trim()) {
      errs.email = "Vui lòng nhập địa chỉ email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Địa chỉ email không đúng định dạng.";
    }

    if (!formData.phone.trim()) {
      errs.phone = "Vui lòng nhập số điện thoại.";
    } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(formData.phone.trim())) {
      errs.phone = "Số điện thoại di động Việt Nam không hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09).";
    }

    if (!formData.password) {
      errs.password = "Vui lòng thiết lập mật khẩu.";
    } else if (formData.password.length < 8) {
      errs.password = "Mật khẩu tối thiểu 8 ký tự.";
    }

    if (!formData.password_confirmation) {
      errs.password_confirmation = "Vui lòng xác nhận lại mật khẩu.";
    } else if (formData.password !== formData.password_confirmation) {
      errs.password_confirmation = "Mật khẩu xác nhận không khớp.";
    }

    if (!formData.agreeTerms) {
      errs.agreeTerms = "Vui lòng đồng ý với Điều khoản và Chính sách của XanhFarm để tiếp tục.";
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

    // Clear specific field error as user types
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

    if (!validateClient()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      };

      const res = await authApi.register(payload);

      // Handle standard response data
      const responseData = res?.data || res || {};
      const registeredUser = responseData.user || {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: "customer",
        roles: ["customer"],
      };
      const token = responseData.token || null;

      // Update auth session
      login(registeredUser, token);
      setRegisteredSuccess(true);
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      }
      setGeneralError(err.message || "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-10 px-4 sm:px-6">
      {/* Breadcrumb Navigation */}
      <div className="max-w-xl w-full mx-auto mb-4 flex items-center gap-2 text-[12.5px] text-on-surface-variant font-medium">
        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">home</span>
          <span>Trang Chủ</span>
        </Link>
        <span>/</span>
        <span className="text-primary font-bold">Đăng Ký Tài Khoản</span>
      </div>

      {/* Main Registration Card */}
      <div className="max-w-xl w-full mx-auto bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden animate-scale">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-6 sm:p-8 text-on-primary relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-[26px]">spa</span>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed/30 border border-secondary-fixed/40 text-[10.5px] font-extrabold uppercase tracking-wider text-secondary-fixed mb-1">
                <span>Thành viên XanhFarm</span>
              </div>
              <h1 className="font-headline-sm text-[20px] sm:text-[22px] font-extrabold tracking-tight">
                Tạo Tài Khoản Khách Hàng
              </h1>
              <p className="text-[12px] text-on-primary/80 mt-0.5">
                Nông sản hữu cơ sạch chuẩn VietGAP & USDA Organic giao tận nhà
              </p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">
          {registeredSuccess ? (
            /* ================= SUCCESS STATE ================= */
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto shadow-inner">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>

              <div className="space-y-1.5">
                <h2 className="font-headline-sm text-[20px] text-primary font-bold">
                  Đăng Ký Thành Công!
                </h2>
                <p className="text-[13px] text-on-surface-variant max-w-sm mx-auto">
                  Chào mừng <span className="font-bold text-primary">{formData.name}</span> đã gia nhập hệ sinh thái nông sản sạch XanhFarm.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-left space-y-2 text-[12px]">
                <p className="font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                  <span>Đặc quyền tài khoản thành viên của bạn:</span>
                </p>
                <ul className="space-y-1 text-on-surface-variant list-disc list-inside">
                  <li>Tích lũy điểm thưởng trên từng đơn mua lẻ và đơn định kỳ.</li>
                  <li>Lưu nhiều địa chỉ nhận hàng tự động tính phí ship theo khoảng cách km.</li>
                  <li>Tra cứu nguồn gốc nông sản chi tiết qua mã QR tem nhãn bao bì.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-[13.5px] hover:bg-primary-container shadow-md transition-all cursor-pointer"
                >
                  Khám Phá Nông Sản Ngay
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="px-6 py-3 rounded-xl bg-surface-container text-on-surface font-semibold text-[13.5px] hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  Về Trang Chủ
                </button>
              </div>
            </div>
          ) : (
            /* ================= REGISTRATION FORM ================= */
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

              {/* 1. Full Name */}
              <div>
                <label htmlFor="reg-name" className="block text-[12.5px] font-bold text-on-surface mb-1">
                  Họ và tên khách hàng <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-outline pointer-events-none">
                    person
                  </span>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-[13px] bg-surface-container-lowest text-on-surface transition-all focus:outline-none focus:ring-2 ${
                      fieldErrors.name
                        ? "border-error focus:ring-error/20"
                        : "border-outline-variant/40 focus:border-secondary focus:ring-secondary/20"
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-[11px] text-error font-medium">{fieldErrors.name}</p>
                )}
              </div>

              {/* 2. Email & Phone in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-[12.5px] font-bold text-on-surface mb-1">
                    Địa chỉ Email <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-outline pointer-events-none">
                      mail
                    </span>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="an.nguyen@gmail.com"
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

                {/* Phone */}
                <div>
                  <label htmlFor="reg-phone" className="block text-[12.5px] font-bold text-on-surface mb-1">
                    Số điện thoại di động <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-outline pointer-events-none">
                      phone
                    </span>
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0912 345 678"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-[13px] bg-surface-container-lowest text-on-surface transition-all focus:outline-none focus:ring-2 ${
                        fieldErrors.phone
                          ? "border-error focus:ring-error/20"
                          : "border-outline-variant/40 focus:border-secondary focus:ring-secondary/20"
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-[11px] text-error font-medium">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* 3. Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className="block text-[12.5px] font-bold text-on-surface mb-1">
                    Mật khẩu đăng nhập <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-outline pointer-events-none">
                      lock
                    </span>
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary p-0.5"
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

                {/* Confirm Password */}
                <div>
                  <label htmlFor="reg-confirm" className="block text-[12.5px] font-bold text-on-surface mb-1">
                    Xác nhận mật khẩu <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-outline pointer-events-none">
                      lock_reset
                    </span>
                    <input
                      id="reg-confirm"
                      name="password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-[13px] bg-surface-container-lowest text-on-surface transition-all focus:outline-none focus:ring-2 ${
                        fieldErrors.password_confirmation
                          ? "border-error focus:ring-error/20"
                          : "border-outline-variant/40 focus:border-secondary focus:ring-secondary/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary p-0.5"
                      aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showConfirmPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {fieldErrors.password_confirmation && (
                    <p className="mt-1 text-[11px] text-error font-medium">
                      {fieldErrors.password_confirmation}
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Terms and Conditions Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 rounded text-primary focus:ring-secondary/40 border-outline-variant/60 accent-[#00450d]"
                  />
                  <span className="text-[12px] text-on-surface-variant leading-relaxed">
                    Tôi đồng ý với{" "}
                    <Link to="/brand" className="text-primary font-bold hover:underline">
                      Điều khoản dịch vụ
                    </Link>{" "}
                    và{" "}
                    <Link to="/brand" className="text-primary font-bold hover:underline">
                      Chính sách bảo mật
                    </Link>{" "}
                    nông sản sạch XanhFarm.
                  </span>
                </label>
                {fieldErrors.agreeTerms && (
                  <p className="mt-1 text-[11px] text-error font-medium">{fieldErrors.agreeTerms}</p>
                )}
              </div>

              {/* 5. Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-[14px] hover:bg-primary-container shadow-md transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang khởi tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[19px]">person_add</span>
                    <span>Đăng Ký Tài Khoản</span>
                  </>
                )}
              </button>

              {/* 6. Switch to Login */}
              <div className="pt-2 text-center text-[13px] text-on-surface-variant">
                <span>Đã có tài khoản XanhFarm? </span>
                <Link to="/login" className="font-bold text-primary hover:text-secondary transition-colors underline">
                  Đăng nhập ngay
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Card Footer Trust Badges */}
        <div className="bg-surface-container-low px-6 py-3.5 border-t border-outline-variant/20 flex flex-wrap items-center justify-around gap-2 text-[11px] font-semibold text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-primary">eco</span>
            100% Hữu cơ VietGAP
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-secondary">local_shipping</span>
            Giao tươi trong 2H
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-primary">loyalty</span>
            Tích điểm đổi quà
          </span>
        </div>
      </div>
    </div>
  );
}
