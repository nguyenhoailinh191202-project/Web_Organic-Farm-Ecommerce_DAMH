/* Storefront navigation that can reflect the current customer session. */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Award,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Search,
  ShoppingBag,
  Sprout,
  X,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";

export default function StorefrontHeader() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userMenuRef = useRef(null);

  const cartCount = Array.isArray(items) ? items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;

  // Detect scroll for enhanced border shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on outside click
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: "Trang chủ", to: "/" },
    { label: "Nông sản", to: "/products" },
    { label: "Gói định kỳ", to: "/subscriptions" },
    { label: "Câu chuyện nông trại", to: "/brand" },
    { label: "Truy xuất QR", to: "/trace/QR-BATCH-2026-03" },
  ];

  const getDashboardRedirect = () => {
    if (user?.role === "farm_staff") return "/farm/seasons";
    if (user?.role === "sales") return "/sales/orders";
    if (user?.role === "admin") return "/admin";
    return "/";
  };

  const getRoleBadgeLabel = () => {
    switch (user?.role) {
      case "farm_staff":
        return "Kỹ Sư Nông Trại";
      case "sales":
        return "Bán Hàng & CSKH";
      case "admin":
        return "Quản Trị Viên";
      default:
        return "Khách Hàng";
    }
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
        <div className="h-18 flex items-center justify-between gap-4">
          {/* ================= ZONE 1: BRAND LOGO ================= */}
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0 group focus:outline-none"
            aria-label="XanhFarm Trang Chủ"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00450d] to-[#006e1c] text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <Sprout className="w-5 h-5 text-[#91f78e]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[20px] tracking-tight text-[#00450d] leading-none">
                XanhFarm
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-[#5a6357] uppercase mt-0.5">
                Nông sản hữu cơ
              </span>
            </div>
          </Link>

          {/* ================= ZONE 2: DESKTOP NAVIGATION ================= */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden lg:flex items-center gap-1 xl:gap-2 px-3 py-1.5 rounded-full bg-[#f2f4f2]/80 border border-[#c0c9bb]/30"
          >
            {navLinks.map((link) => {
              const isActive =
                link.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-1.5 rounded-full text-[13.5px] font-semibold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? "bg-[#00450d] text-white shadow-xs"
                      : "text-[#41493e] hover:text-[#00450d] hover:bg-white/70"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* ================= ZONE 3: ACTIONS & AUTH ================= */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick search input (Desktop) */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center relative w-44 lg:w-52"
            >
              <input
                type="text"
                placeholder="Tìm nông sản..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-[#f2f4f2] hover:bg-white focus:bg-white border border-transparent focus:border-[#00450d]/30 rounded-xl outline-none transition-all placeholder:text-[#5a6357]"
              />
              <Search className="w-4 h-4 text-[#5a6357] absolute left-3 pointer-events-none" />
            </form>

            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl text-[#00450d] hover:bg-[#f2f4f2] transition-colors focus:outline-none"
              aria-label={`Giỏ hàng, hiện có ${cartCount} sản phẩm`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] px-1 rounded-full bg-[#006e1c] text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Authentication State */}
            {!user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-[13px] font-bold text-[#00450d] hover:bg-[#f2f4f2] rounded-xl transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-[13px] font-bold text-white bg-[#00450d] hover:bg-[#006e1c] rounded-xl shadow-xs transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            ) : (
              /* Logged In User Dropdown */
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[#c0c9bb]/40 bg-[#f2f4f2]/70 hover:bg-white hover:border-[#00450d]/40 transition-all cursor-pointer focus:outline-none"
                  aria-expanded={isUserMenuOpen}
                  aria-label="Menu tài khoản người dùng"
                >
                  <div className="w-8 h-8 rounded-full bg-[#00450d] text-white flex items-center justify-center font-bold text-[13px] shrink-0">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block max-w-[120px]">
                    <p className="text-[12.5px] font-bold text-[#00450d] truncate leading-tight">
                      {user.name || "Khách hàng"}
                    </p>
                    <p className="text-[10px] text-[#5a6357] font-semibold truncate leading-tight">
                      {getRoleBadgeLabel()}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5a6357] shrink-0" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#c0c9bb]/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-[#c0c9bb]/20">
                      <p className="text-[13px] font-bold text-[#191c1b] truncate">
                        {user.name || "Tài khoản"}
                      </p>
                      <p className="text-[11px] text-[#5a6357] truncate font-mono mt-0.5">
                        {user.email}
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#91f78e]/30 text-[#00450d]">
                        {getRoleBadgeLabel()}
                      </span>
                    </div>

                    <div className="py-1">
                      {/* Customer Links */}
                      {user.role === "customer" && (
                        <>
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
                        </>
                      )}

                      {/* Staff & Admin Links */}
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
                        onClick={logout}
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

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl text-[#00450d] hover:bg-[#f2f4f2] transition-colors focus:outline-none"
              aria-label={isMobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ================= MOBILE DRAWER MENU ================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#c0c9bb]/30 bg-white px-4 pt-3 pb-6 shadow-lg animate-in fade-in duration-150">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              placeholder="Tìm kiếm nông sản sạch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-[13.5px] bg-[#f2f4f2] border border-transparent focus:border-[#00450d]/40 rounded-xl outline-none"
            />
            <Search className="w-4 h-4 text-[#5a6357] absolute left-3 top-3 pointer-events-none" />
          </form>

          {/* Navigation Links */}
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenus}
                className={`block px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                  location.pathname === link.to
                    ? "bg-[#00450d] text-white"
                    : "text-[#191c1b] hover:bg-[#f2f4f2]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Auth Actions */}
          <div className="pt-4 mt-3 border-t border-[#c0c9bb]/20">
            {!user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 text-[13px] font-bold text-[#00450d] border border-[#00450d]/40 rounded-xl"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center py-2.5 text-[13px] font-bold text-white bg-[#00450d] rounded-xl"
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
                {user.role === "customer" && (
                  <div className="space-y-1">
                    <Link
                      to="/orders"
                      className="flex items-center gap-2 px-3 py-2 text-[13.5px] font-medium text-[#41493e] hover:bg-[#f2f4f2] rounded-lg"
                    >
                      <Receipt className="w-4 h-4 text-[#5a6357]" />
                      Đơn hàng của tôi
                    </Link>
                    <Link
                      to="/subscriptions"
                      className="flex items-center gap-2 px-3 py-2 text-[13.5px] font-medium text-[#41493e] hover:bg-[#f2f4f2] rounded-lg"
                    >
                      <Calendar className="w-4 h-4 text-[#5a6357]" />
                      Gói rau định kỳ
                    </Link>
                    <Link
                      to="/rewards"
                      className="flex items-center gap-2 px-3 py-2 text-[13.5px] font-medium text-[#41493e] hover:bg-[#f2f4f2] rounded-lg"
                    >
                      <Award className="w-4 h-4 text-[#5a6357]" />
                      Ví điểm thưởng
                    </Link>
                  </div>
                )}
                {["farm_staff", "sales", "admin"].includes(user.role) && (
                  <Link
                    to={getDashboardRedirect()}
                    className="flex items-center gap-2 px-3 py-2 text-[13.5px] font-bold text-[#00450d] bg-[#91f78e]/30 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Vào trang làm việc nội bộ
                  </Link>
                )}
                <button
                  type="button"
                  onClick={logout}
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
