/* Shared dashboard frame for farm staff, sales, and administrators. */
import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import DynamicSidebar from "../components/navigation/DynamicSidebar";
import { useAuth } from "../context/useAuth";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : user?.vai_tro
        ? [user.vai_tro]
        : [];

  const userName = user?.name || user?.ho_ten || "Nhân sự";
  const userEmail = user?.email || "";

  const getPortalHeaderInfo = () => {
    if (location.pathname.startsWith("/farm")) {
      return {
        title: "Cổng Kỹ Sư Canh Tác",
        desc: "Quản lý mùa vụ, nhật ký canh tác & kiểm định chất lượng lô hàng",
        icon: "agriculture",
        badge: "Kỹ Sư Nông Trại",
        badgeStyle: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
      };
    }
    if (location.pathname.startsWith("/sales")) {
      return {
        title: "Cổng Bán Hàng & CSKH",
        desc: "Tiếp nhận đơn hàng, kho hàng FEFO & xử lý khiếu nại khách hàng",
        icon: "support_agent",
        badge: "Bán Hàng & CSKH",
        badgeStyle: "bg-amber-50 text-amber-800 border-amber-200/80",
      };
    }
    if (location.pathname.startsWith("/admin")) {
      return {
        title: "Cổng Quản Trị Hệ Thống",
        desc: "Báo cáo thống kê, quản lý tài khoản RBAC & cấu hình vận hành",
        icon: "admin_panel_settings",
        badge: "Quản Trị Viên",
        badgeStyle: "bg-teal-50 text-teal-800 border-teal-200/80",
      };
    }
    return {
      title: "Khu Vực Nghiệp Vụ Nội Bộ",
      desc: "Hệ thống quản lý và điều hành trực tuyến nông trại sạch XanhFarm",
      icon: "dashboard",
      badge: "Nhân Sự",
      badgeStyle: "bg-surface-container text-on-surface border-outline-variant/50",
    };
  };

  const portalHeader = getPortalHeaderInfo();

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container">
      {/* 1. DYNAMIC SIDEBAR (Sticky on desktop, drawer on mobile) */}
      <DynamicSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/25 h-16 sm:h-18 px-4 sm:px-6 flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container-low transition-colors"
              aria-label="Mở menu quản trị"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex w-9 h-9 rounded-xl bg-primary/10 text-primary items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">{portalHeader.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-headline-sm text-[16px] sm:text-[18px] text-primary font-bold leading-tight">
                    {portalHeader.title}
                  </h1>
                  <span
                    className={`hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${portalHeader.badgeStyle}`}
                  >
                    {portalHeader.badge}
                  </span>
                </div>
                <p className="hidden md:block text-[11px] text-on-surface-variant truncate max-w-md">
                  {portalHeader.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Storefront Link & Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Link to Storefront */}
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[12.5px] border border-outline-variant/30 transition-all shadow-2xs"
              title="Xem giao diện mua sắm khách hàng"
            >
              <span className="material-symbols-outlined text-[17px] text-secondary">
                storefront
              </span>
              <span>Cửa Hàng</span>
            </Link>

            {/* Profile Menu Trigger */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  profileMenuOpen
                    ? "bg-white border-primary/40 shadow-sm ring-2 ring-primary/10"
                    : "bg-surface-container-low hover:bg-white border-outline-variant/30"
                }`}
                aria-expanded={profileMenuOpen}
                title="Thông tin người dùng"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[13px] shadow-xs shrink-0">
                  {userName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block leading-tight max-w-[120px]">
                  <p className="font-bold text-[12px] text-primary truncate">{userName}</p>
                  <p className="text-[10px] text-outline font-mono truncate">{userRoles[0] || "staff"}</p>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] text-outline transition-transform duration-200 ${
                    profileMenuOpen ? "rotate-180 text-primary" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>

              {/* Profile Dropdown Popover */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-outline-variant/20">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-outline mb-1">
                      Tài Khoản Đang Đăng Nhập
                    </p>
                    <p className="font-bold text-[14px] text-primary truncate">{userName}</p>
                    <p className="text-[11px] text-outline font-mono truncate">{userEmail}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-container text-on-surface-variant">
                      <span className="material-symbols-outlined text-[13px]">badge</span>
                      <span>{portalHeader.badge}</span>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-1">
                    <Link
                      to="/"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-[17px] text-secondary">
                        storefront
                      </span>
                      <span>Về Trang Mua Sắm</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-bold text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">logout</span>
                      <span>Đăng Xuất Khỏi Hệ Thống</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8faf8]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Internal Dashboard Footer */}
        <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/20 py-3.5 px-6 text-center text-[12px] text-on-surface-variant">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 Nông Trại XanhFarm • Hệ Thống Vận Hành & Quản Trị Nông Sản Sạch</span>
            <span className="font-semibold text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              Bảo mật RBAC & Kiểm soát truy cập nội bộ
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
