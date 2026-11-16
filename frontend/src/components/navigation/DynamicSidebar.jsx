/* Dashboard navigation filtered by the current user's role. */
import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function DynamicSidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : user?.vai_tro
        ? [user.vai_tro]
        : [];

  const isFarmStaff = userRoles.includes("farm_staff");
  const isSales = userRoles.includes("sales");
  const isAdmin = userRoles.includes("admin");

  const primaryRole = isAdmin
    ? "admin"
    : isSales
      ? "sales"
      : isFarmStaff
        ? "farm_staff"
        : userRoles[0] || "";

  const userName = user?.name || user?.ho_ten || "";
  const userEmail = user?.email || "";

  const getRoleConfig = (role) => {
    switch (role) {
      case "farm_staff":
        return {
          sectionTitle: "QUẢN LÝ NÔNG TRẠI",
          rolePill: "Kỹ thuật Nông trại (Farm Staff)",
          menuItems: [
            { path: "/farm/seasons", label: "Mùa vụ & Canh tác", icon: "calendar_month" },
            { path: "/farm/batches", label: "Lô thu hoạch & QR", icon: "spa" },
            { path: "/farm/certificates", label: "Chứng nhận VietGAP", icon: "verified" },
          ],
        };
      case "sales":
        return {
          sectionTitle: "QUẢN LÝ BÁN HÀNG",
          rolePill: "Bán hàng & CSKH (Sales)",
          menuItems: [
            { path: "/sales/orders", label: "Đơn hàng & Giao nhận", icon: "receipt_long" },
            { path: "/sales/inventory", label: "Kho hàng & Tồn FEFO", icon: "warehouse" },
            { path: "/sales/flash-sales", label: "Cảnh báo & Flash Sale", icon: "bolt" },
            { path: "/sales/claims", label: "Xử lý khiếu nại", icon: "support_agent" },
          ],
        };
      case "admin":
        return {
          sectionTitle: "QUẢN TRỊ HỆ THỐNG",
          rolePill: "Quản trị hệ thống (Admin)",
          menuItems: [
            { path: "/admin", label: "Báo cáo quản trị", icon: "monitoring", end: true },
            { path: "/admin/users", label: "Quản lý tài khoản", icon: "admin_panel_settings" },
            { path: "/admin/settings", label: "Cấu hình hệ thống", icon: "tune" },
          ],
        };
      default:
        return {
          sectionTitle: "KHU VỰC NỘI BỘ",
          rolePill: "Nhân sự nội bộ",
          menuItems: [],
        };
    }
  };

  const roleConfig = getRoleConfig(primaryRole);

  const handleLogout = () => {
    onCloseMobile();
    logout();
    navigate("/");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#063a19] text-white select-none">
      {/* 1. TOP BRAND HEADER */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-white/10">
        <Link
          to="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group cursor-pointer"
          title="XanhFarm - Về trang chủ"
        >
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shadow-xs shrink-0 group-hover:bg-white/20 transition-colors">
            <span className="material-symbols-outlined text-[20px] text-[#7ae582]">
              spa
            </span>
          </div>

          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-[17px] font-extrabold text-white tracking-tight">
                  XanhFarm
                </span>
                <span className="bg-[#1b5e20] text-[#a3f3a8] border border-[#2e7d32] text-[9.5px] font-extrabold px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                  NỘI BỘ
                </span>
              </div>
              <span className="text-[11px] text-emerald-200/80 font-medium tracking-wide mt-0.5">
                Nông Trại Xanh Củ Chi
              </span>
            </div>
          )}
        </Link>

        {/* Collapse toggle (Desktop) / Close button (Mobile) */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 rounded-lg text-emerald-300/70 hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
            aria-label="Thu gọn hoặc mở rộng thanh menu"
          >
            <span className="material-symbols-outlined text-[18px]">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-emerald-300/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Đóng menu"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>

      {/* 2. USER IDENTITY CARD (Hiển thị đúng thông tin tài khoản thật) */}
      {!collapsed && userName && (
        <div className="mx-3 mt-3 mb-4 p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#7ae582] text-[#063a19] flex items-center justify-center font-bold text-[13px] shrink-0 shadow-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-bold text-[12.5px] text-white truncate" title={userName}>
                {userName}
              </p>
              {userEmail && (
                <p className="text-[10.5px] text-emerald-300/70 truncate font-mono mt-0.5" title={userEmail}>
                  {userEmail}
                </p>
              )}
            </div>
          </div>

          <div className="mt-2.5 px-3 py-1 rounded-full bg-[#03260e]/80 border border-emerald-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34d399] shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[11px] font-bold text-emerald-200 truncate">
              {roleConfig.rolePill}
            </span>
          </div>
        </div>
      )}

      {/* 3. NAVIGATION SECTION */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-6" aria-label="Menu chức năng">
        <div>
          {!collapsed && (
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-emerald-300/90 mb-2.5">
              {roleConfig.sectionTitle}
            </p>
          )}

          <div className="space-y-1.5">
            {roleConfig.menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-150 ${
                    collapsed ? "justify-center px-0" : ""
                  } ${
                    isActive
                      ? "bg-[#7ae582] text-[#063a19] font-bold shadow-md"
                      : "text-white/85 hover:text-white hover:bg-white/10 font-semibold"
                  }`
                }
                title={item.label}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`material-symbols-outlined text-[20px] shrink-0 ${
                        isActive ? "text-[#063a19] font-bold" : "text-emerald-300/80"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && <span className="text-[13.5px] truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* 4. ADMIN OVERSIGHT SECTIONS */}
        {isAdmin && !collapsed && (
          <div className="pt-3 border-t border-white/10 space-y-4">
            <div>
              <p className="px-3 text-[10.5px] font-bold uppercase tracking-wider text-emerald-300/70 mb-2">
                Giám Sát Canh Tác
              </p>
              <div className="space-y-1">
                <NavLink
                  to="/farm/seasons"
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-colors ${
                      isActive ? "bg-white/20 text-[#7ae582] font-bold" : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[17px] text-emerald-300/70">
                    calendar_month
                  </span>
                  <span>Mùa vụ & Canh tác</span>
                </NavLink>
                <NavLink
                  to="/farm/batches"
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-colors ${
                      isActive ? "bg-white/20 text-[#7ae582] font-bold" : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[17px] text-emerald-300/70">
                    spa
                  </span>
                  <span>Lô thu hoạch & QR</span>
                </NavLink>
                <NavLink
                  to="/farm/certificates"
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-colors ${
                      isActive ? "bg-white/20 text-[#7ae582] font-bold" : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[17px] text-emerald-300/70">
                    verified
                  </span>
                  <span>Chứng nhận VietGAP</span>
                </NavLink>
              </div>
            </div>

            <div>
              <p className="px-3 text-[10.5px] font-bold uppercase tracking-wider text-emerald-300/70 mb-2">
                Giám Sát Bán Hàng
              </p>
              <div className="space-y-1">
                <NavLink
                  to="/sales/orders"
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-colors ${
                      isActive ? "bg-white/20 text-[#7ae582] font-bold" : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[17px] text-emerald-300/70">
                    receipt_long
                  </span>
                  <span>Đơn hàng & Giao nhận</span>
                </NavLink>
                <NavLink
                  to="/sales/inventory"
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-colors ${
                      isActive ? "bg-white/20 text-[#7ae582] font-bold" : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[17px] text-emerald-300/70">
                    warehouse
                  </span>
                  <span>Kho hàng & Tồn FEFO</span>
                </NavLink>
                <NavLink
                  to="/sales/claims"
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-colors ${
                      isActive ? "bg-white/20 text-[#7ae582] font-bold" : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[17px] text-emerald-300/70">
                    support_agent
                  </span>
                  <span>Xử lý khiếu nại</span>
                </NavLink>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 5. BOTTOM ACTIONS */}
      <div className="p-3 border-t border-white/10 bg-[#042d13]/90 space-y-2">
        {!collapsed && (
          <div className="px-3 py-2 rounded-xl bg-[#021f0e]/80 border border-emerald-500/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[17px] text-[#7ae582] shrink-0">
              location_on
            </span>
            <span className="text-[11.5px] font-semibold text-emerald-100/90 truncate">
              Nông Trại Xanh Củ Chi, TP.HCM
            </span>
          </div>
        )}

        <Link
          to="/"
          onClick={onCloseMobile}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold text-emerald-200 hover:text-white hover:bg-white/10 transition-colors ${
            collapsed ? "justify-center px-0" : ""
          }`}
          title="Xem trang mua sắm nông sản"
        >
          <span className="material-symbols-outlined text-[18px] text-[#7ae582] shrink-0">
            storefront
          </span>
          {!collapsed && <span>Xem Cửa Hàng (Storefront)</span>}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[12.5px] font-semibold text-rose-200/90 hover:text-rose-100 hover:bg-rose-500/20 transition-colors cursor-pointer ${
            collapsed ? "justify-center px-0" : ""
          }`}
          title="Đăng xuất tài khoản"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">
            logout
          </span>
          {!collapsed && <span>Đăng xuất tài khoản</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-[#063a19] h-screen sticky top-0 z-30 transition-all duration-200 shadow-xl border-r border-[#002d10] ${
          collapsed ? "w-20" : "w-64 xl:w-72"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#063a19] shadow-2xl z-10 animate-slide-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
