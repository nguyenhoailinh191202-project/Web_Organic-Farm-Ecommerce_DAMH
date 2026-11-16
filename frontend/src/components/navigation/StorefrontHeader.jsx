/* Shared storefront header matching the exact UI design in DoAn.
 * Clean, elegant navbar for guests and customers.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Award,
  BadgeCheck,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  ShoppingBag,
  X,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";

export default function StorefrontHeader() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const cartCount = Array.isArray(items)
    ? items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    : 0;

  // Detect scroll for enhanced border shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const getDashboardRedirect = () => {
    if (user?.role === "farm_staff") return "/farm/seasons";
    if (user?.role === "sales") return "/sales/orders";
    if (user?.role === "admin") return "/admin";
    return "/";
  };

  const isCurrentActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 bg-white/95 backdrop-blur-md ${
        isScrolled
          ? "border-b border-[#c0c9bb]/40 shadow-xs"
          : "border-b border-[#c0c9bb]/20"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-20 flex items-center justify-between gap-4">
          {/* ================= ZONE 1: BRAND LOGO (LEFT) ================= */}
          <Link
            to="/"
            onClick={closeMenus}
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none select-none"
            aria-label="XanhFarm Trang Chủ"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#00450d] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-[20px] text-[#00450d] tracking-tight leading-tight group-hover:text-[#006e1c] transition-colors">
                XanhFarm
              </span>
              <span className="text-[10px] font-bold tracking-wider text-[#00450d] uppercase mt-0.5 whitespace-nowrap">
                NÔNG SẢN HỮU CƠ SẠCH
              </span>
            </div>
          </Link>

          {/* ================= ZONE 2: NAVIGATION LINKS (CENTER) ================= */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden lg:flex items-center gap-6 xl:gap-8"
          >
            {/* 1. Trang Chủ */}
            <Link
              to="/"
              className={`relative py-1 text-[14px] font-semibold transition-all duration-150 whitespace-nowrap ${
                isCurrentActive("/")
                  ? "text-[#00450d] font-bold"
                  : "text-[#41493e] hover:text-[#00450d]"
              }`}
            >
              <span>Trang Chủ</span>
              {isCurrentActive("/") && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2.5px] bg-[#00450d] rounded-full" />
              )}
            </Link>

            {/* 2. Nông Sản */}
            <Link
              to="/products"
              className={`relative py-1 text-[14px] font-semibold transition-all duration-150 whitespace-nowrap ${
                isCurrentActive("/products")
                  ? "text-[#00450d] font-bold"
                  : "text-[#41493e] hover:text-[#00450d]"
              }`}
            >
              <span>Nông Sản</span>
              {isCurrentActive("/products") && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2.5px] bg-[#00450d] rounded-full" />
              )}
            </Link>

            {/* 3. Câu Chuyện & Chứng Nhận */}
            <Link
              to="/brand"
              className={`relative py-1 text-[14px] font-semibold transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 ${
                isCurrentActive("/brand")
                  ? "text-[#00450d] font-bold"
                  : "text-[#41493e] hover:text-[#00450d]"
              }`}
            >
              <BadgeCheck className="w-4 h-4 text-[#006e1c] shrink-0" />
              <span>Câu Chuyện & Chứng Nhận</span>
              {isCurrentActive("/brand") && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2.5px] bg-[#00450d] rounded-full" />
              )}
            </Link>

            {/* 4. Gói Định Kỳ */}
            <Link
              to="/subscriptions"
              className={`relative py-1 text-[14px] font-semibold transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 ${
                isCurrentActive("/subscriptions")
                  ? "text-[#00450d] font-bold"
                  : "text-[#006e1c] hover:text-[#00450d]"
              }`}
            >
              <span>Gói Định Kỳ</span>
              <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-[#86efac]/35 text-[#00450d] border border-[#86efac]/60 leading-none">
                -20%
              </span>
              {isCurrentActive("/subscriptions") && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2.5px] bg-[#00450d] rounded-full" />
              )}
            </Link>

            {/* 5. Về XanhFarm */}
            <Link
              to="/brand"
              className="relative py-1 text-[14px] font-semibold text-[#41493e] hover:text-[#00450d] transition-colors duration-150 whitespace-nowrap"
            >
              <span>Về XanhFarm</span>
            </Link>

            {/* 6. Liên Hệ */}
            <a
              href="#lien-he"
              onClick={(e) => {
                e.preventDefault();
                const footerEl = document.querySelector("footer");
                if (footerEl) {
                  footerEl.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="relative py-1 text-[14px] font-semibold text-[#41493e] hover:text-[#00450d] transition-colors duration-150 whitespace-nowrap"
            >
              <span>Liên Hệ</span>
            </a>
          </nav>

          {/* ================= ZONE 3: ACTIONS & AUTH (RIGHT) ================= */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              className="relative p-2 rounded-full text-[#191c1b] hover:text-[#00450d] hover:bg-[#f2f4f2] transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
              aria-label={`Giỏ hàng nông sản, hiện có ${cartCount} sản phẩm`}
            >
              <ShoppingBag className="w-5 h-5 text-[#191c1b]" />
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#f2f4f2] text-[#41493e] border border-[#c0c9bb]/40 font-bold text-[10.5px] flex items-center justify-center leading-none">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            </Link>

            {/* Guest Auth Buttons */}
            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-[13.5px] font-semibold text-[#00450d] bg-[#f2f4f2] hover:bg-[#e6eae6] transition-colors whitespace-nowrap"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-[13.5px] font-semibold text-white bg-[#00450d] hover:bg-[#006e1c] transition-colors shadow-2xs whitespace-nowrap"
                >
                  Đăng ký
                </Link>
              </div>
            ) : (
              /* Logged In Customer Menu */
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[#c0c9bb]/40 bg-[#f2f4f2]/70 hover:bg-white hover:border-[#00450d]/40 transition-all cursor-pointer focus:outline-none"
                  aria-expanded={isUserMenuOpen}
                  aria-label="Menu tài khoản"
                >
                  <div className="w-8 h-8 rounded-full bg-[#00450d] text-white flex items-center justify-center font-bold text-[13px] shrink-0">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block max-w-[120px]">
                    <p className="text-[12.5px] font-bold text-[#00450d] truncate leading-tight">
                      {user.name || "Khách hàng"}
                    </p>
                    <p className="text-[10px] text-[#5a6357] font-semibold truncate leading-tight">
                      Khách hàng
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5a6357] shrink-0" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#c0c9bb]/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-[#c0c9bb]/20">
                      <p className="text-[13px] font-bold text-[#191c1b] truncate">
                        {user.name || "Khách hàng"}
                      </p>
                      <p className="text-[11px] text-[#5a6357] truncate font-mono mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/orders"
                        onClick={closeMenus}
                        className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#41493e] hover:text-[#00450d] hover:bg-[#f2f4f2] transition-colors"
                      >
                        <Receipt className="w-4 h-4 text-[#5a6357]" />
                        <span>Đơn hàng của tôi</span>
                      </Link>
                      <Link
                        to="/subscriptions"
                        onClick={closeMenus}
                        className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#41493e] hover:text-[#00450d] hover:bg-[#f2f4f2] transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-[#5a6357]" />
                        <span>Gói rau định kỳ</span>
                      </Link>
                      <Link
                        to="/rewards"
                        onClick={closeMenus}
                        className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#41493e] hover:text-[#00450d] hover:bg-[#f2f4f2] transition-colors"
                      >
                        <Award className="w-4 h-4 text-[#5a6357]" />
                        <span>Ví điểm thưởng</span>
                      </Link>
                      {["farm_staff", "sales", "admin"].includes(user.role) && (
                        <Link
                          to={getDashboardRedirect()}
                          onClick={closeMenus}
                          className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-bold text-[#00450d] hover:bg-[#f2f4f2] transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#006e1c]" />
                          <span>Vào trang làm việc nội bộ</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 mt-1 border-t border-[#c0c9bb]/20">
                      <button
                        type="button"
                        onClick={() => {
                          closeMenus();
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl text-[#00450d] hover:bg-[#f2f4f2] transition-colors focus:outline-none"
              aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================= MOBILE DRAWER MENU ================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#c0c9bb]/30 bg-white px-4 pt-3 pb-6 shadow-lg animate-in fade-in duration-150">
          <div className="space-y-1">
            <Link
              to="/"
              onClick={closeMenus}
              className={`block px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                isCurrentActive("/")
                  ? "bg-[#00450d] text-white"
                  : "text-[#191c1b] hover:bg-[#f2f4f2]"
              }`}
            >
              Trang Chủ
            </Link>

            <Link
              to="/products"
              onClick={closeMenus}
              className={`block px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                isCurrentActive("/products")
                  ? "bg-[#00450d] text-white"
                  : "text-[#191c1b] hover:bg-[#f2f4f2]"
              }`}
            >
              Nông Sản
            </Link>

            <Link
              to="/brand"
              onClick={closeMenus}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                isCurrentActive("/brand")
                  ? "bg-[#00450d] text-white"
                  : "text-[#191c1b] hover:bg-[#f2f4f2]"
              }`}
            >
              <BadgeCheck className="w-4 h-4 text-[#006e1c]" />
              <span>Câu Chuyện & Chứng Nhận</span>
            </Link>

            <Link
              to="/subscriptions"
              onClick={closeMenus}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                isCurrentActive("/subscriptions")
                  ? "bg-[#00450d] text-white"
                  : "text-[#191c1b] hover:bg-[#f2f4f2]"
              }`}
            >
              <span>Gói Định Kỳ</span>
              <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-[#86efac]/35 text-[#00450d] border border-[#86efac]/60">
                -20%
              </span>
            </Link>

            <Link
              to="/brand"
              onClick={closeMenus}
              className="block px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-[#191c1b] hover:bg-[#f2f4f2] transition-colors"
            >
              Về XanhFarm
            </Link>

            <a
              href="#lien-he"
              onClick={(e) => {
                e.preventDefault();
                closeMenus();
                const footerEl = document.querySelector("footer");
                if (footerEl) {
                  footerEl.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="block px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-[#191c1b] hover:bg-[#f2f4f2] transition-colors"
            >
              Liên Hệ
            </a>
          </div>

          {/* Mobile Auth Actions */}
          <div className="pt-4 mt-3 border-t border-[#c0c9bb]/20">
            {!user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={closeMenus}
                  className="w-full text-center py-2.5 text-[13px] font-semibold text-[#00450d] bg-[#f2f4f2] rounded-xl"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenus}
                  className="w-full text-center py-2.5 text-[13px] font-semibold text-white bg-[#00450d] rounded-xl"
                >
                  Đăng ký
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-[#f2f4f2] rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[#00450d] text-white flex items-center justify-center font-bold text-[13px]">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-[13px] font-bold text-[#191c1b] truncate">{user.name}</p>
                    <p className="text-[11px] text-[#5a6357] truncate">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Link
                    to="/orders"
                    onClick={closeMenus}
                    className="flex items-center gap-2 px-3 py-2 text-[13.5px] font-medium text-[#41493e] hover:bg-[#f2f4f2] rounded-lg"
                  >
                    <Receipt className="w-4 h-4 text-[#5a6357]" />
                    Đơn hàng của tôi
                  </Link>
                  <Link
                    to="/subscriptions"
                    onClick={closeMenus}
                    className="flex items-center gap-2 px-3 py-2 text-[13.5px] font-medium text-[#41493e] hover:bg-[#f2f4f2] rounded-lg"
                  >
                    <Calendar className="w-4 h-4 text-[#5a6357]" />
                    Gói rau định kỳ
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeMenus();
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[13.5px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
