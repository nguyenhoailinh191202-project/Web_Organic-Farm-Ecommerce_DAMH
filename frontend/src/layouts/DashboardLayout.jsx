/* Shared dashboard frame for farm staff, sales, and administrators. */
import { useEffect, useRef, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  Menu,
  ShieldAlert,
  Sprout,
  Store,
} from "lucide-react";
import DynamicSidebar from "../components/navigation/DynamicSidebar";
import { useAuth } from "../context/useAuth";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleBadge = () => {
    switch (user?.role) {
      case "farm_staff":
        return {
          label: "Kỹ Sư Nông Trại",
          portal: "Cổng Canh Tác & Nhật Ký Lô Hàng",
          color: "bg-[#91f78e]/30 text-[#00450d] border-[#91f78e]/60",
        };
      case "sales":
        return {
          label: "Bán Hàng & CSKH",
          portal: "Cổng Quản Lý Đơn & Kho FEFO",
          color: "bg-amber-100 text-amber-900 border-amber-300",
        };
      case "admin":
        return {
          label: "Quản Trị Viên",
          portal: "Cổng Quản Trị Hệ Thống Toàn Quyền",
          color: "bg-[#00450d] text-white border-[#006e1c]",
        };
      default:
        return {
          label: "Nội Bộ",
          portal: "Cổng Thông Tin Nội Bộ",
          color: "bg-gray-100 text-gray-800 border-gray-300",
        };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <div className="min-h-screen bg-[#f8faf8] text-[#191c1b] flex selection:bg-[#91f78e] selection:text-[#00450d]">
      {/* Dynamic Left Sidebar with RBAC Filtering */}
      <DynamicSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#c0c9bb]/30 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Mobile Toggle & Portal Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#00450d] hover:bg-[#f2f4f2] transition-colors focus:outline-none"
              aria-label="Mở menu quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00450d] to-[#006e1c] text-white hidden sm:flex items-center justify-center shadow-xs">
                <Sprout className="w-4 h-4 text-[#91f78e]" />
              </div>
              <div>
                <h1 className="text-[14px] sm:text-[15px] font-bold text-[#00450d] leading-none">
                  {roleInfo.portal}
                </h1>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold border ${roleInfo.color}`}
                >
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Store Link & User Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold text-[#00450d] bg-[#f2f4f2] hover:bg-white border border-[#c0c9bb]/30 transition-all shadow-2xs"
            >
              <Store className="w-4 h-4 text-[#006e1c]" />
              <span>Xem Cửa Hàng</span>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-[#c0c9bb]/30 hover:border-[#00450d]/40 bg-white sm:bg-[#f2f4f2]/60 hover:bg-white transition-all cursor-pointer focus:outline-none"
                aria-expanded={isUserMenuOpen}
                aria-label="Tài khoản cá nhân"
              >
                <div className="w-8 h-8 rounded-full bg-[#00450d] text-white flex items-center justify-center font-bold text-[13px] shrink-0">
                  {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block max-w-[120px]">
                  <p className="text-[12px] font-bold text-[#191c1b] truncate leading-tight">
                    {user?.name || "Nhân sự"}
                  </p>
                  <p className="text-[10px] text-[#5a6357] truncate font-mono leading-tight">
                    {roleInfo.label}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#5a6357] hidden sm:block shrink-0" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#c0c9bb]/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-[#c0c9bb]/20">
                    <p className="text-[13px] font-bold text-[#191c1b] truncate">
                      {user?.name || "Nhân sự"}
                    </p>
                    <p className="text-[11px] text-[#5a6357] font-mono truncate">{user?.email}</p>
                    <span
                      className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.color}`}
                    >
                      {roleInfo.label}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[12.5px] font-semibold text-[#41493e] hover:text-[#00450d] hover:bg-[#f2f4f2]"
                    >
                      <Store className="w-4 h-4 text-[#006e1c]" />
                      <span>Xem Cửa Hàng XanhFarm</span>
                    </Link>
                  </div>

                  {user?.role === "farm_staff" && (
                    <div className="px-4 py-2 border-t border-[#c0c9bb]/20 bg-amber-50/60">
                      <p className="text-[11px] text-amber-800 leading-tight flex items-start gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        Chính sách: Tài khoản kỹ sư nông trại bị chặn quyền xem doanh thu và dữ liệu khách hàng.
                      </p>
                    </div>
                  )}

                  <div className="pt-1 border-t border-[#c0c9bb]/20">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-[12.5px] font-bold text-red-600 hover:bg-red-50 text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Nested Route View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
