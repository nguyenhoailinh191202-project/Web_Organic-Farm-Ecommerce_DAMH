/* Dashboard navigation filtered by the current user's role. */
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  ChevronRight,
  Headphones,
  LogOut,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  Sprout,
  Store,
  Users,
  Warehouse,
  X,
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
          title: "Cổng Kỹ Sư Canh Tác",
          badge: "Kỹ Sư Nông Trại",
          badgeStyle: "bg-[#91f78e]/30 text-[#00450d] border border-[#91f78e]/60",
          desc: "Quản lý mùa vụ, nhật ký & kiểm định",
          menu: [
            {
              to: "/farm/seasons",
              label: "Mùa Vụ Canh Tác",
              desc: "Gieo trồng & chăm sóc",
              icon: Calendar,
            },
            {
              to: "/farm/batches",
              label: "Lô Hàng & Thu Hoạch",
              desc: "Thu hoạch & in tem QR",
              icon: Package,
            },
            {
              to: "/farm/certificates",
              label: "Chứng Nhận & Kiểm Định",
              desc: "VietGAP, đất & nước",
              icon: ShieldCheck,
            },
          ],
        };
      case "sales":
        return {
          title: "Cổng Bán Hàng & CSKH",
          badge: "Bán Hàng & CSKH",
          badgeStyle: "bg-amber-100 text-amber-900 border border-amber-300",
          desc: "Xác nhận đơn, kho FEFO & khiếu nại",
          menu: [
            {
              to: "/sales/orders",
              label: "Đơn Hàng & Giao Nhận",
              desc: "Xác nhận đơn & điều phối",
              icon: Receipt,
            },
            {
              to: "/sales/inventory",
              label: "Quản Lý Kho FEFO",
              desc: "Hạn dùng & tồn kho lô",
              icon: Warehouse,
            },
            {
              to: "/sales/flash-sales",
              label: "Flash Sale Cận Hạn",
              desc: "Xả kho lô cận hạn <48h",
              icon: Zap,
            },
            {
              to: "/sales/claims",
              label: "Xử Lý Khiếu Nại",
              desc: "Bồi hoàn & đổi trả CSKH",
              icon: Headphones,
            },
          ],
        };
      case "admin":
        return {
          title: "Cổng Quản Trị Hệ Thống",
          badge: "Quản Trị Viên",
          badgeStyle: "bg-[#00450d] text-white border border-[#006e1c]",
          desc: "Thống kê, phân quyền & tham số",
          menu: [
            {
              to: "/admin",
              label: "Báo Cáo Thống Kê",
              desc: "Doanh thu & hiệu suất kho",
              icon: BarChart3,
            },
            {
              to: "/admin/users",
              label: "Quản Lý Tài Khoản",
              desc: "Cấp quyền & ma trận RBAC",
              icon: Users,
            },
            {
              to: "/admin/settings",
              label: "Cấu Hình Hệ Thống",
              desc: "Cước ship, điểm thưởng & hạn",
              icon: Settings,
            },
          ],
        };
      default:
        return {
          title: "Khu Vực Nội Bộ",
          badge: "Nhân Sự XanhFarm",
          badgeStyle: "bg-gray-100 text-gray-800 border border-gray-300",
          desc: "Hệ thống quản lý nông sản",
          menu: [],
        };
    }
  };

  const roleConfig = getRoleConfig();

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 bg-white border-r border-[#c0c9bb]/30">
      <div className="space-y-6">
        {/* Brand & Mobile Close */}
        <div className="flex items-center justify-between pb-4 border-b border-[#c0c9bb]/20">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00450d] to-[#006e1c] text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5 text-[#91f78e]" />
            </div>
            <div>
              <span className="font-extrabold text-[18px] text-[#00450d] tracking-tight leading-none block">
                XanhFarm
              </span>
              <span className="text-[10px] font-bold text-[#5a6357] tracking-wider uppercase">
                Quản Trị Nội Bộ
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#5a6357] hover:bg-[#f2f4f2]"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Portal Card */}
        <div className="p-3 rounded-2xl bg-[#f2f4f2]/70 border border-[#c0c9bb]/30">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5a6357]">
              Phân hệ làm việc
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight ${roleConfig.badgeStyle}`}
            >
              {roleConfig.badge}
            </span>
          </div>
          <h2 className="text-[14px] font-bold text-[#00450d] truncate">{roleConfig.title}</h2>
          <p className="text-[11.5px] text-[#5a6357] mt-0.5 leading-snug">{roleConfig.desc}</p>
        </div>

        {/* Dynamic RBAC Navigation Menu */}
        <nav aria-label="Điều hướng quản trị nội bộ" className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#5a6357] mb-2">
            Chức năng nghiệp vụ
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
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? "bg-[#00450d] text-white shadow-xs font-bold"
                    : "text-[#41493e] hover:bg-[#f2f4f2] hover:text-[#00450d] font-semibold"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? "text-[#91f78e]" : "text-[#5a6357] group-hover:text-[#00450d]"
                    }`}
                  />
                  <div className="truncate text-left">
                    <p className="text-[13px] leading-tight truncate">{item.label}</p>
                    <p
                      className={`text-[10.5px] leading-tight truncate mt-0.5 ${
                        isActive ? "text-white/80" : "text-[#5a6357]"
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive
                      ? "text-white opacity-100"
                      : "text-[#c0c9bb] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="space-y-2 pt-4 border-t border-[#c0c9bb]/20">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-[#00450d] hover:bg-[#f2f4f2] transition-colors"
        >
          <Store className="w-4 h-4 text-[#006e1c]" />
          <span>Về Cửa Hàng XanhFarm</span>
        </Link>

        <div className="p-2.5 rounded-xl bg-[#f2f4f2] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#00450d] text-white flex items-center justify-center font-bold text-[12px] shrink-0">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-[12px] font-bold text-[#191c1b] truncate">
                {user?.name || "Nhân sự"}
              </p>
              <p className="text-[10px] text-[#5a6357] truncate font-mono">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Đăng xuất"
            aria-label="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
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
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
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
