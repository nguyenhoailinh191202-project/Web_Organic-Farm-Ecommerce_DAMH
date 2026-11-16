/* Storefront navigation that can reflect the current customer session. */
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";

export default function StorefrontHeader() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const profileMenuRef = useRef(null);

  const cartCount = Array.isArray(items)
    ? items.reduce((sum, item) => sum + (item.so_luong || item.quantity || 1), 0)
    : 0;

  const isGuest = !user;
  const userRole = user?.role || user?.vai_tro || "customer";
  const userName = user?.name || user?.ho_ten || (isGuest ? "Khách vãng lai" : "Khách hàng");
  const userEmail = user?.email || "";
  const isStaffOrAdmin = ["farm_staff", "sales", "admin"].includes(userRole);

  // Sync scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          const yOffset = -85;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 150);
      return;
    }

    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const el = document.getElementById(id);
    if (el) {
      const yOffset = -85;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "customer":
        return { label: "Khách hàng", icon: "account_circle", path: "/orders" };
      case "farm_staff":
        return { label: "Kỹ sư nông trại", icon: "agriculture", path: "/farm/seasons" };
      case "sales":
        return { label: "Bán hàng / CSKH", icon: "support_agent", path: "/sales/orders" };
      case "admin":
        return { label: "Quản trị viên", icon: "dashboard", path: "/admin" };
      default:
        return { label: "Khách vãng lai", icon: "person", path: "/" };
    }
  };

  const portalInfo = getRoleBadge(userRole);

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate("/");
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-200 ${
        isScrolled
          ? "bg-surface-container-lowest/98 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-b border-outline-variant/30"
          : "bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/15"
      }`}
    >
      {/* Top subtle brand accent line */}
      <div className="h-[1px] w-full bg-outline-variant/20" />

      {/* ========================================================================= */}
      {/* 1. MOBILE HEADER (< 1024px)                                               */}
      {/* ========================================================================= */}
      <div className="h-20 max-w-7xl mx-auto px-4 flex lg:hidden items-center justify-between w-full">
        {/* Mobile Brand Logo */}
        <Link
          to="/"
          onClick={() => scrollToSection("top")}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-xs shrink-0">
            <svg className="w-5 h-5 text-secondary-fixed" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-headline-sm text-[19px] text-primary-container tracking-tight leading-tight font-extrabold">
              XanhFarm
            </span>
            <span className="font-label-sm text-[12px] text-secondary font-bold tracking-wider uppercase mt-0.5">
              {isStaffOrAdmin ? portalInfo.label : "Nông sản hữu cơ sạch"}
            </span>
          </div>
        </Link>

        {/* Mobile Right: Cart + Menu toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {!isStaffOrAdmin && (
            <Link
              to="/cart"
              aria-label="Giỏ hàng nông sản"
              className="relative p-2 text-on-surface-variant hover:text-primary rounded-full transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[23px]">shopping_bag</span>
              {cartCount > 0 ? (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-secondary text-white text-[12px] rounded-full flex items-center justify-center px-1 font-bold shadow-xs">
                  {cartCount}
                </span>
              ) : (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] bg-surface-container-high text-on-surface-variant text-[12px] rounded-full flex items-center justify-center font-bold">
                  0
                </span>
              )}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Mở menu điều hướng"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP HEADER (>= 1024px): 3-COLUMN MATHEMATICALLY BALANCED GRID     */}
      {/* ========================================================================= */}
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 w-full hidden lg:grid lg:grid-cols-[220px_1fr_220px] xl:grid-cols-[260px_1fr_260px] items-center">
        {/* ================= ZONE 1: BRAND LOGO (LEFT) ================= */}
        <div className="flex items-center justify-start shrink-0">
          <Link
            to="/"
            onClick={() => scrollToSection("top")}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="XanhFarm - Về trang chủ"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-xs group-hover:scale-102 transition-transform shrink-0">
              <svg className="w-5 h-5 text-secondary-fixed" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-headline-sm text-[20px] text-primary-container tracking-tight leading-tight group-hover:text-secondary transition-colors font-extrabold">
                XanhFarm
              </span>
              <span className="font-label-sm text-[12px] text-secondary font-bold tracking-wider uppercase mt-0.5 whitespace-nowrap">
                {isStaffOrAdmin ? portalInfo.label : "Nông sản hữu cơ sạch"}
              </span>
            </div>
          </Link>
        </div>

        {/* ================= ZONE 2: CENTER NAVIGATION ================= */}
        <nav className="flex items-center justify-center gap-1 xl:gap-2 px-1" aria-label="Điều hướng chính">
          <Link
            to="/"
            className={`relative px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center ${
              isActive("/")
                ? "text-primary font-bold"
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/70"
            }`}
          >
            <span>Trang Chủ</span>
            {isActive("/") && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />
            )}
          </Link>

          <Link
            to="/products"
            className={`relative px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center ${
              isActive("/products")
                ? "text-primary font-bold"
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/70"
            }`}
          >
            <span>Nông Sản</span>
            {isActive("/products") && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />
            )}
          </Link>

          <Link
            to="/brand"
            className={`relative px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
              isActive("/brand")
                ? "text-primary font-bold"
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/70"
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
            <span>Câu Chuyện & Chứng Nhận</span>
            {isActive("/brand") && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />
            )}
          </Link>

          <Link
            to="/subscriptions"
            className={`relative px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
              isActive("/subscriptions")
                ? "text-primary font-bold"
                : "text-secondary hover:text-primary hover:bg-surface-container-low/70 font-bold"
            }`}
          >
            <span>Gói Định Kỳ</span>
            <span className="text-[12px] bg-secondary/15 text-secondary border border-secondary/25 px-1.5 py-0.5 rounded-full font-bold leading-none">
              -20%
            </span>
            {isActive("/subscriptions") && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />
            )}
          </Link>

          <button
            type="button"
            onClick={() => scrollToSection("quy-trinh-nong-trai")}
            className="relative px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap text-on-surface-variant hover:text-primary hover:bg-surface-container-low/70"
          >
            <span>Về XanhFarm</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("lien-he")}
            className="relative px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap text-on-surface-variant hover:text-primary hover:bg-surface-container-low/70"
          >
            <span>Liên Hệ</span>
          </button>
        </nav>

        {/* ================= ZONE 3: RIGHT ACTIONS ================= */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {/* Cart Icon Button (Visible to Customers and Guests) */}
          {!isStaffOrAdmin && (
            <Link
              to="/cart"
              aria-label="Giỏ hàng nông sản"
              className="relative p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-colors flex items-center justify-center group cursor-pointer"
              title="Xem giỏ hàng nông sản"
            >
              <span className="material-symbols-outlined text-[21px] group-hover:scale-105 transition-transform">
                shopping_bag
              </span>
              {cartCount > 0 ? (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-secondary text-white text-[12px] rounded-full flex items-center justify-center px-1 font-bold shadow-xs">
                  {cartCount}
                </span>
              ) : (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] bg-surface-container-high text-on-surface-variant text-[12px] rounded-full flex items-center justify-center font-bold">
                  0
                </span>
              )}
            </Link>
          )}

          {/* ================= USER AUTH & ROLE PILL ================= */}
          {isGuest ? (
            /* CASE A: GUEST USER */
            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-surface-container-low text-primary-container hover:bg-surface-container hover:text-primary transition-all font-semibold cursor-pointer text-[13px] whitespace-nowrap"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all font-semibold shadow-xs cursor-pointer text-[13px] whitespace-nowrap"
              >
                Đăng ký
              </Link>
            </div>
          ) : (
            /* CASE B: LOGGED IN USER */
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-1.5 h-9 pl-2.5 pr-2 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-secondary/50 transition-all text-left shadow-2xs group cursor-pointer"
                title={`Đang đăng nhập: ${userName} (${portalInfo.label})`}
              >
                <div className="hidden xl:flex flex-col text-right leading-none">
                  <span className="font-bold text-[11.5px] text-primary truncate max-w-[95px]">
                    {userName.split(" ").slice(-1).join(" ")}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase text-secondary tracking-tight mt-0.5">
                    {userRole}
                  </span>
                </div>

                <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs group-hover:bg-primary-container transition-colors">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                </div>

                <span className="material-symbols-outlined text-[15px] text-outline group-hover:text-primary transition-colors">
                  arrow_drop_down
                </span>
              </button>

              {/* Profile Dropdown Popover */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-84 bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 p-4 z-50 animate-scale">
                  {/* User Profile Card */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 mb-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[14px] text-primary truncate">
                        {userName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[12px] font-extrabold uppercase bg-secondary-fixed text-on-secondary-fixed shrink-0">
                        {userRole}
                      </span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant truncate">
                      {userEmail}
                    </p>
                  </div>

                  {/* Dedicated Portal Primary Shortcut if staff/admin */}
                  {isStaffOrAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate(portalInfo.path);
                      }}
                      className="w-full mb-3 p-3 rounded-2xl bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container transition-all shadow-sm flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">
                            {portalInfo.icon}
                          </span>
                        </div>
                        <span>Vào Bảng Quản Trị</span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>
                  ) : null}

                  {/* Useful Customer Quick Shortcuts */}
                  <div className="space-y-1 pb-3 border-b border-outline-variant/20 text-[13px]">
                    {userRole === "customer" && (
                      <>
                        <Link
                          to="/orders"
                          onClick={() => setProfileMenuOpen(false)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface-container-low text-on-surface flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px] text-primary">
                            receipt_long
                          </span>
                          <span>Lịch Sử Đơn Hàng Đã Mua</span>
                        </Link>

                        <Link
                          to="/subscriptions"
                          onClick={() => setProfileMenuOpen(false)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface-container-low text-on-surface flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px] text-secondary">
                            calendar_month
                          </span>
                          <span>Lịch Sử Gói Định Kỳ</span>
                        </Link>

                        <Link
                          to="/rewards"
                          onClick={() => setProfileMenuOpen(false)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface-container-low text-on-surface flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px] text-secondary">
                            loyalty
                          </span>
                          <span>Ví Điểm & Đổi Quà</span>
                        </Link>
                      </>
                    )}

                    <Link
                      to="/trace/KH-2026-001"
                      onClick={() => setProfileMenuOpen(false)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface-container-low text-on-surface flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        qr_code_scanner
                      </span>
                      <span>Tra Cứu Lô Hàng & Nhật Ký QR</span>
                    </Link>

                    <Link
                      to="/subscriptions"
                      onClick={() => setProfileMenuOpen(false)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface-container-low text-on-surface flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        event_repeat
                      </span>
                      <span>Gói Rau Củ Định Kỳ (-20%)</span>
                    </Link>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full py-2 rounded-xl bg-surface-container-low hover:bg-error-container hover:text-error text-[12px] font-bold text-on-surface-variant flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      <span>Đăng Xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE EXPANDABLE DRAWER                                               */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-outline-variant/20 bg-surface-container-lowest/98 backdrop-blur-xl p-5 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto animate-fadeIn">
          {/* Mobile Nav Links */}
          <div className="grid grid-cols-2 gap-2 text-[14px] font-bold">
            <Link
              to="/"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection("top");
              }}
              className={`text-left p-3 rounded-xl transition-colors ${
                isActive("/")
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface"
              }`}
            >
              Trang Chủ
            </Link>

            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-left p-3 rounded-xl transition-colors ${
                isActive("/products")
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface"
              }`}
            >
              Nông Sản
            </Link>

            <button
              type="button"
              onClick={() => scrollToSection("quy-trinh-nong-trai")}
              className="text-left p-3 rounded-xl bg-surface-container-low text-on-surface hover:bg-primary hover:text-white transition-colors"
            >
              Về XanhFarm
            </button>

            <Link
              to="/trace/KH-2026-001"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left p-3 rounded-xl bg-surface-container-low text-on-surface hover:bg-primary hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">
                qr_code_scanner
              </span>
              <span>Truy Xuất QR</span>
            </Link>

            <Link
              to="/brand"
              onClick={() => setMobileMenuOpen(false)}
              className="col-span-2 text-left p-3 rounded-xl bg-surface-container-low text-primary font-bold hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">
                verified
              </span>
              <span>Câu Chuyện Thương Hiệu & Chứng Nhận</span>
            </Link>

            <Link
              to="/subscriptions"
              onClick={() => setMobileMenuOpen(false)}
              className="col-span-2 text-left p-3 rounded-xl bg-secondary-fixed/40 text-secondary hover:bg-secondary hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">event_repeat</span>
              <span>Gói Rau Củ Định Kỳ (-20%)</span>
            </Link>
          </div>

          {/* Customer History Links in Mobile Drawer */}
          {userRole === "customer" && (
            <div className="pt-2 border-t border-outline-variant/20 space-y-1.5">
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-[13px] flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">
                  receipt_long
                </span>
                <span>Lịch Sử Đơn Hàng Đã Mua</span>
              </Link>
              <Link
                to="/subscriptions"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-[13px] flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  calendar_month
                </span>
                <span>Lịch Sử Gói Định Kỳ</span>
              </Link>
              <Link
                to="/rewards"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-[13px] flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  loyalty
                </span>
                <span>Ví Điểm & Đổi Quà</span>
              </Link>
            </div>
          )}

          {/* Internal Staff Dashboard Banner in Mobile Drawer */}
          {isStaffOrAdmin && (
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[13px] text-primary">{userName}</span>
                <span className="text-[12px] font-bold uppercase bg-primary text-on-primary px-2 py-0.5 rounded-md">
                  {userRole}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(portalInfo.path);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-primary text-on-primary font-bold text-[13px] flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">{portalInfo.icon}</span>
                <span>Vào Bảng Quản Trị</span>
              </button>
            </div>
          )}

          {/* Mobile Auth Actions */}
          {isGuest ? (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/20">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 rounded-xl bg-surface-container text-primary font-bold text-[13px] text-center"
              >
                Đăng Nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 rounded-xl bg-primary text-on-primary font-bold text-[13px] text-center"
              >
                Đăng Ký
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 rounded-xl bg-surface-container-low text-error font-bold text-[12px] flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Đăng Xuất</span>
              </button>
            </div>
          )}

          {/* Mobile Hotline */}
          <div className="pt-2 text-center text-[12px] text-outline border-t border-outline-variant/20">
            Hotline đặt rau tươi hỏa tốc:{" "}
            <a href="tel:19006868" className="font-bold text-primary text-[13px] ml-1">
              1900 6868
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
