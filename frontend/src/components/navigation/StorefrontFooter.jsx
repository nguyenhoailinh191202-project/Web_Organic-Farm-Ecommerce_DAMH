/* Shared footer for storefront pages. */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Sprout,
  Truck,
} from "lucide-react";

export default function StorefrontFooter() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setIsSubscribed(false), 5000);
    }
  };

  return (
    <footer className="w-full bg-[#f2f4f2] text-[#191c1b] border-t border-[#c0c9bb]/30 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* ================= COL 1: BRAND & TRUST (4 COLS) ================= */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00450d] to-[#006e1c] text-white flex items-center justify-center shadow-xs">
                <Sprout className="w-5 h-5 text-[#91f78e]" />
              </div>
              <span className="font-extrabold text-[22px] tracking-tight text-[#00450d]">
                XanhFarm
              </span>
            </Link>

            <p className="text-[13px] text-[#41493e] leading-relaxed max-w-sm">
              Hệ sinh thái nông sản hữu cơ nguyên bản từ nông trại xanh đạt chuẩn VietGAP &
              USDA Organic. Kết nối trực tiếp nông dân đến bàn ăn, mang trọn vị ngọt mát thuần
              khiết tới từng bữa cơm gia đình.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-[12px] font-bold text-[#00450d] border border-[#c0c9bb]/40 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006e1c]" />
                VietGAP
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-[12px] font-bold text-[#006e1c] border border-[#c0c9bb]/40 shadow-2xs">
                <Award className="w-3.5 h-3.5 text-[#006e1c]" />
                USDA Organic
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-[12px] font-bold text-[#41493e] border border-[#c0c9bb]/40 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00450d]" />
                OCOP 4 Sao
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-[12px] font-bold text-[#5a6357] border border-[#c0c9bb]/40 shadow-2xs">
                Quatest 3
              </span>
            </div>

            <div className="pt-2 text-[12.5px] text-[#5a6357] space-y-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#006e1c] shrink-0 mt-0.5" />
                <span>Nông trại Củ Chi: Tỉnh Lộ 7, Xã An Nhơn Tây, Củ Chi, TP. HCM</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#006e1c] shrink-0 mt-0.5" />
                <span>Nông trại Đà Lạt: Thung lũng Đạ Sar, Huyện Lạc Dương, Lâm Đồng</span>
              </div>
            </div>
          </div>

          {/* ================= COL 2: DANH MỤC NÔNG SẢN (2 COLS) ================= */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-[13.5px] text-[#00450d] uppercase tracking-wider">
              Danh Mục
            </h4>
            <ul className="space-y-2 text-[13px] text-[#41493e]">
              <li>
                <Link to="/products" className="hover:text-[#00450d] transition-colors">
                  Rau củ hữu cơ Đà Lạt
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-[#00450d] transition-colors">
                  Trái cây nhiệt đới tươi
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-[#00450d] transition-colors">
                  Nấm tươi & Thảo mộc
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-[#00450d] transition-colors">
                  Gạo sạch & Hạt mầm
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="hover:text-[#00450d] transition-colors font-semibold text-[#006e1c]">
                  Combo rau tuần (-20%)
                </Link>
              </li>
            </ul>
          </div>

          {/* ================= COL 3: CHÍNH SÁCH & TRUY XUẤT (3 COLS) ================= */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-[13.5px] text-[#00450d] uppercase tracking-wider">
              Chính Sách & Dịch Vụ
            </h4>
            <ul className="space-y-2 text-[13px] text-[#41493e]">
              <li className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-[#006e1c] shrink-0" />
                <span>Giao hàng 2H (thùng lạnh giữ ẩm)</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006e1c] shrink-0" />
                <span>Cam kết bồi hoàn & đổi trả 100%</span>
              </li>
              <li>
                <Link
                  to="/trace/QR-BATCH-2026-03"
                  className="inline-flex items-center gap-2 text-[#00450d] hover:underline font-semibold"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Truy xuất nguồn gốc tem QR
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="hover:text-[#00450d] transition-colors">
                  Đăng ký nhận rau định kỳ
                </Link>
              </li>
              <li>
                <Link to="/brand" className="hover:text-[#00450d] transition-colors">
                  Câu chuyện thương hiệu & Triết lý
                </Link>
              </li>
            </ul>
          </div>

          {/* ================= COL 4: NEWSLETTER & HOTLINE (3 COLS) ================= */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-[13.5px] text-[#00450d] uppercase tracking-wider">
              Ưu Đãi & Đăng Ký
            </h4>
            <p className="text-[12.5px] text-[#41493e] leading-relaxed">
              Nhận ngay mã voucher <strong className="text-[#006e1c]">giảm 10%</strong> cho đơn
              đầu tiên cùng cẩm nang sống xanh mỗi tuần.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-1.5">
                <input
                  type="email"
                  required
                  placeholder="Email của bạn..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 text-[13px] bg-white border border-[#c0c9bb]/50 rounded-xl outline-none focus:border-[#00450d] transition-all"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 text-[13px] font-bold text-white bg-[#00450d] hover:bg-[#006e1c] rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  Gửi
                </button>
              </div>
              {isSubscribed && (
                <p className="text-[11.5px] font-semibold text-[#006e1c] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Cảm ơn bạn! Ưu đãi đã được gửi tới email.
                </p>
              )}
            </form>

            <div className="pt-2 border-t border-[#c0c9bb]/20 space-y-1 text-[12.5px] text-[#5a6357]">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#006e1c]" />
                <span>
                  Hotline CSKH: <strong className="text-[#191c1b]">1900 6868</strong> (8:00 - 20:00)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#006e1c]" />
                <span>Email: contact@xanhfarm.vn</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM BAR ================= */}
        <div className="mt-12 pt-6 border-t border-[#c0c9bb]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#5a6357]">
          <p>© 2026 XanhFarm. Hệ thống TMĐT Nông sản sạch - Đồ án tốt nghiệp.</p>
          <div className="flex items-center gap-4">
            <Link to="/brand" className="hover:text-[#00450d] transition-colors">
              Tiêu chuẩn chất lượng
            </Link>
            <span>•</span>
            <span className="hover:text-[#00450d] transition-colors cursor-pointer">
              Bảo mật thông tin
            </span>
            <span>•</span>
            <span className="hover:text-[#00450d] transition-colors cursor-pointer">
              Quy chế hoạt động
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
