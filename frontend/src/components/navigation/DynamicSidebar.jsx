/* Dashboard navigation sidebar matching the design in DoAn (dark green, role-isolated). */
import { Link, useLocation } from "react-router-dom";
import {
  Award,
  BarChart3,
  Calendar,
  ChevronLeft,
  Headphones,
  LogOut,
  MapPin,
  Receipt,
  Settings,
  Sprout,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";

export default function DynamicSidebar({ isOpen = false, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getRoleConfig = () => {
    switch (user?.role) {
      case "farm_staff":
        return {
          portalBadge: "NỘI BỘ",
          sectionTitle: "QUẢN LÝ NÔNG TRẠI",
          statusPill: "Kỹ thuật Nông trại (Farm Staff)",
          defaultName: "Phạm Hoàng Kỹ Thuật (Farm Staff)",
          defaultEmail: "farm.kythuat@nongsansach.vn",
          menu: [
            {
              to: "/farm/seasons",
              label: "Mùa vụ & Canh tác",
              icon: Calendar,
            },
            {
              to: "/farm/batches",
              label: "Lô thu hoạch & QR",
              icon: Sprout,
            },
            {
              to: "/farm/certificates",
              label: "Chứng nhận VietGAP",
              icon: Award,
            },
          ],
        };
      case "sales":
        return {
          portalBadge: "NỘI BỘ",
          sectionTitle: "QUẢN LÝ BÁN HÀNG & CSKH",
          statusPill: "Nhân viên Bán hàng (Sales)",
          defaultName: "Trần Thị Thu Hà (Sales)",
          defaultEmail: "sales.ha@nongsansach.vn",
          menu: [
            {
              to: "/sales/orders",
              label: "Đơn hàng & Giao nhận",
              icon: Receipt,
            },
            {
              to: "/sales/inventory",
              label: "Quản lý kho FEFO",
              icon: Warehouse,
            },
            {
              to: "/sales/flash-sales",
              label: "Flash Sale cận hạn",
              icon: Zap,
            },
            {
              to: "/sales/claims",
              label: "Xử lý khiếu nại",
              icon: Headphones,
            },
          ],
        };
      case "admin":
        return {
          portalBadge: "NỘI BỘ",
          sectionTitle: "QUẢN TRỊ HỆ THỐNG",
          statusPill: "Quản trị viên (Admin)",
          defaultName: "Nguyễn Minh Quản Trị (Admin)",
          defaultEmail: "admin@nongsansach.vn",
          menu: [
            {
              to: "/admin",
              label: "Báo cáo thống kê",
              icon: BarChart3,
            },
            {
              to: "/admin/users",
              label: "Quản lý tài khoản",
              icon: Users,
            },
            {
              to: "/admin/settings",
              label: "Cấu hình hệ thống",
              icon: Settings,
            },
          ],
        };
      default:
        return {
          portalBadge: "NỘI BỘ",
          sectionTitle: "KHU VỰC QUẢN TRỊ",
          statusPill: "Nhân sự nội bộ",
          defaultName: "Nhân sự XanhFarm",
          defaultEmail: "nhansu@nongsansach.vn",
          menu: [],
        };
    }
  };

  const roleConfig = getRoleConfig();

  const getDashboardHome = () => {
    switch (user?.role) {
      case "farm_staff":
        return "/farm/seasons";
      case "sales":
        return "/sales/orders";
      case "admin":
        return "/admin";
      default:
        return "/admin";
    }
  };

  const displayName = user?.name || roleConfig.defaultName;
  const displayEmail = user?.email || roleConfig.defaultEmail;
  const initial = displayName.charAt(0).toUpperCase();

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 bg-[#064e2e] text-white border-r border-[#0a5c37] select-none">
      <div className="space-y-4">
        {/* ================= 1. BRAND HEADER ================= */}
        <div className="flex items-center justify-between pb-3 border-b border-[#0f6b41]/60">
          <Link
            to={getDashboardHome()}
            onClick={onClose}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-[#043d24] border border-[#0f6b41] flex items-center justify-center text-[#86efac] shadow-xs shrink-0">
              <Sprout className="w-5 h-5 text-[#86efac]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[17px] text-white tracking-tight leading-none">
                  XanhFarm
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-extrabold bg-[#0d5932] text-[#86efac] border border-[#167844] tracking-wide">
                  {roleConfig.portalBadge}
                </span>
              </div>
              <span className="text-[11px] text-[#a3c9a8] font-medium leading-tight block mt-0.5">
                Nông Trại Xanh Củ Chi
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300/60 hover:text-white hover:bg-white/10"
            aria-label="Thu gọn hoặc đóng menu"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* ================= 2. USER PROFILE CARD ================= */}
        <div className="p-3 rounded-2xl bg-[#043821]/80 border border-[#0e633c]/60 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#86efac] text-[#064e2e] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[13px] text-white truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[11px] text-emerald-300/70 truncate font-mono leading-tight mt-0.5">
                {displayEmail}
              </p>
            </div>
          </div>

          <div className="mt-2.5 px-2.5 py-1 rounded-xl bg-[#032e1b] border border-[#0c5936] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#86efac] shrink-0" />
            <span className="text-[11px] font-bold text-[#86efac] truncate">
              {roleConfig.statusPill}
            </span>
          </div>
        </div>

        {/* ================= 3. NAVIGATION MENU ================= */}
        <nav aria-label="Điều hướng quản trị nội bộ" className="space-y-1.5 pt-2">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-emerald-300/60 mb-2">
            {roleConfig.sectionTitle}
          </p>

          {roleConfig.menu.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-150 ${
                  isActive
                    ? "bg-[#86efac] text-[#064e2e] font-bold shadow-sm"
                    : "text-emerald-100/90 hover:bg-white/10 hover:text-white font-semibold"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "text-[#064e2e]" : "text-emerald-300/80 group-hover:text-white"
                  }`}
                />
                <span className="text-[13.5px] leading-tight truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ================= 4. BOTTOM FOOTER SECTION ================= */}
      <div className="space-y-2 pt-4 border-t border-[#0f6b41]/60">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#032e1b] border border-[#0c5936] text-emerald-200 text-[11.5px] font-medium">
          <MapPin className="w-4 h-4 text-[#86efac] shrink-0" />
          <span className="truncate">Cơ sở #1 • Củ Chi, TP.HCM</span>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-200/90 hover:bg-rose-500/20 hover:text-white transition-colors text-[13px] font-semibold text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-300" />
          <span>Đăng xuất tài khoản</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar (260px) */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
